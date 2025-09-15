# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import re
from collections import Counter
import pycountry
import pickle
import numpy as np
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

# Optional LLM (Groq)
try:
    from langchain_groq import ChatGroq
    from langchain.schema import HumanMessage
    HAS_GROQ = True
except Exception:
    HAS_GROQ = False
    print("Groq LLM not available. Please install langchain-groq and set GROQ_API_KEY.")

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})  # allow all origins for dev

# ---------------- CONFIG (user-provided credentials embedded, moved from Streamlit) ----------------
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY") # Default, but prefer .env
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD") # Use App Password for Gmail
MANUFACTURER_EMAIL = os.getenv("MANUFACTURER_EMAIL")  # change to real manufacturer email
# ---------------------------------------------------------------------------


# Helper: safe map country name -> ISO3 (returns original name if not found)
def country_to_iso3(name):
    if not isinstance(name, str) or not name.strip():
        return None
    try:
        # try direct search
        c = pycountry.countries.lookup(name)
        return c.alpha_3
    except Exception:
        # try fuzzy/replace common names
        mapping = {
            "usa": "USA",
            "us": "USA",
            "united states": "USA",
            "uk": "GBR",
            "united kingdom": "GBR",
        }
        normalized = name.strip().lower()
        if normalized in mapping:
            return mapping[normalized]
        return None

def fill_missing(df):
    for col in ["classification", "risk_class", "country", "name_mfr", "distributed_to", "name", "description"]:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown")
    return df

# ----------------- Load model and encoders (robust, from Streamlit) -----------------
# Attempt to load model & encoders. App will continue even if these are not perfect.
raw_model = None
try:
    with open("risk_model.pkl", "rb") as f:
        raw_model = pickle.load(f)
except FileNotFoundError:
    print("risk_model.pkl not found — app will use a safe heuristic predictor.")

encoders_raw = {}
try:
    with open("encoders.pkl", "rb") as f:
        encoders_raw = pickle.load(f)
except FileNotFoundError:
    print("encoders.pkl not found — categorical encoding will be skipped if needed.")


# Simple heuristic predictor fallback (never fails)
class HeuristicPredictor:
    def __init__(self):
        self.classes_ = np.array([1, 2, 3])

    def predict(self, X):
        xs = pd.DataFrame(X)
        results = []
        for _, row in xs.iterrows():
            ne = 0
            qty = 0
            for c in ["num_events", "numEvents", "num event", "events"]:
                if c in row.index:
                    try:
                        ne = int(row[c])
                        break
                    except Exception:
                        ne = 0
            for c in ["quantity_in_commerce", "quantity", "qty"]:
                if c in row.index:
                    try:
                        qty = float(row[c])
                        break
                    except Exception:
                        qty = 0
            if ne >= 5:
                results.append(3)
            elif ne >= 2:
                results.append(2)
            else:
                results.append(1)
        return np.array(results)


# Try to extract a usable predictor from the loaded object
def extract_predictor(obj):
    if obj is None:
        return HeuristicPredictor()
    if hasattr(obj, "predict") and callable(getattr(obj, "predict")):
        return obj
    if isinstance(obj, dict):
        common_keys = ["model", "estimator", "classifier", "clf", "pipeline", "best_estimator_"]
        for k in common_keys:
            if k in obj and hasattr(obj[k], "predict"):
                return obj[k]
        for v in obj.values():
            p = extract_predictor(v)
            if p is not None and hasattr(p, "predict"):
                return p
    for attr in ["best_estimator_", "estimator_", "clf", "model_"]:
        if hasattr(obj, attr):
            candidate = getattr(obj, attr)
            if hasattr(candidate, "predict"):
                return candidate
    try:
        for attr in dir(obj):
            try:
                val = getattr(obj, attr)
                if hasattr(val, "predict"):
                    return val
            except Exception:
                continue
    except Exception:
        pass
    return HeuristicPredictor()

predictor = extract_predictor(raw_model)

# Encoders: accept dict-like or other shapes
if isinstance(encoders_raw, dict):
    le_dict = encoders_raw
else:
    le_dict = {}
    try:
        if hasattr(encoders_raw, "classes_"):
            # A single LabelEncoder was saved, but no mapping to column names.
            # We'll need to handle it differently if it were actually used for a specific col.
            print("Single encoder loaded — but no mapping to column names. Skipping label encoding unless explicitly mapped.")
        else:
            print("Encoders raw is not a dict and not a single LabelEncoder. Skipping label encoding.")
    except Exception:
        print("Error inspecting encoders_raw. Skipping label encoding.")


# ----------------- Helper: safe label-encode (if encoder exists, from Streamlit) -----------------
def safe_label_transform(col, val):
    if isinstance(le_dict, dict) and col in le_dict:
        le = le_dict[col]
        if hasattr(le, "classes_"):
            try:
                if "Unknown" not in le.classes_:
                    le.classes_ = np.append(le.classes_, "Unknown")
            except Exception:
                pass
            try:
                if str(val) not in le.classes_.astype(str):
                    val_to_transform = "Unknown"
                else:
                    val_to_transform = val
                return int(le.transform([str(val_to_transform)])[0])
            except Exception:
                return abs(hash(str(val))) % 1000
    try:
        return float(val)
    except Exception:
        return abs(hash(str(val))) % 1000

# ----------------- Fixed Email helper (from Streamlit) -----------------
def send_email(to_address, subject, body):
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_address
        msg["Subject"] = subject
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
        return True, None
    except Exception as e:
        return False, str(e)


@app.route("/process-csv", methods=["POST"])
def process_csv():
    try:
        uploaded_file = request.files.get("file")
        if uploaded_file is None:
            return jsonify({"error": "No file uploaded"}), 400

        df = pd.read_csv(uploaded_file, low_memory=False)
        df = df.drop_duplicates().reset_index(drop=True)
        df = fill_missing(df)

        for col in ["is_recall", "num_events", "quantity_in_commerce", "days_since_last_event"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        classifications = sorted(df["classification"].unique().tolist()) if "classification" in df else []
        manufacturers = sorted(df["name_mfr"].dropna().unique().tolist()) if "name_mfr" in df else []
        countries = sorted(df["country"].dropna().unique().tolist()) if "country" in df else []

        preview = df.head(20).to_dict(orient="records")
        full_records = df.to_dict(orient="records")

        return jsonify({
            "classifications": classifications,
            "manufacturers": manufacturers, # Added for frontend dropdowns
            "countries": countries,         # Added for frontend dropdowns
            "preview": preview,
            "data": full_records
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get-dashboard", methods=["POST"])
def get_dashboard():
    try:
        payload = request.get_json()
        classification = payload.get("classification")
        csv_data = payload.get("csv_data", [])

        if not classification:
            return jsonify({"error": "classification required"}), 400
        if not csv_data:
            return jsonify({"error": "csv_data required"}), 400

        df = pd.DataFrame(csv_data)
        if "classification" not in df.columns:
            return jsonify({"error": "csv_data missing 'classification' column"}), 400

        class_df = df[df["classification"] == classification].copy()
        class_df = fill_missing(class_df)

        for col in ["is_recall", "num_events", "quantity_in_commerce", "days_since_last_event"]:
            if col in class_df.columns:
                class_df[col] = pd.to_numeric(class_df[col], errors="coerce").fillna(0)

        total_devices = int(len(class_df))
        recall_rate = float(class_df["is_recall"].mean() * 100) if "is_recall" in class_df else 0.0
        avg_events = float(class_df["num_events"].mean()) if "num_events" in class_df and len(class_df) else 0.0
        safe_devices = total_devices - int((recall_rate / 100) * total_devices)

        high_risk_pct = 0.0
        if "risk_class" in class_df:
            high_risk_pct = float(class_df["risk_class"].astype(str).str.contains("High", case=False).mean() * 100)

        failure_risk_score = float((recall_rate * 0.7) + (high_risk_pct * 0.3))

        failure_cause = "Unknown"
        if "description" in class_df:
            words = []
            for desc in class_df["description"].astype(str):
                tokens = re.findall(r"\b[a-zA-Z]+\b", desc.lower())
                words.extend(tokens)
            common_words = Counter(words).most_common(20)
            failure_cause = common_words[0][0] if common_words else "Unknown"

        risky_country = "Unknown"
        try:
            if "country" in class_df and "is_recall" in class_df:
                recalled = class_df[class_df["is_recall"] == 1]
                if len(recalled):
                    risky_country = recalled["country"].value_counts().idxmax()
        except Exception:
            risky_country = "Unknown"

        top_mfrs = class_df["name_mfr"].value_counts().head(3).index.tolist() if "name_mfr" in class_df else []

        recall_pie = None
        if "is_recall" in class_df:
            rv = class_df["is_recall"].value_counts().to_dict()
            labels = [str(k) for k in rv.keys()]
            values = [int(v) for v in rv.values()]
            recall_pie = {"labels": labels, "values": values, "hole": 0.4, "title": "Recall Distribution"}

        risk_bar = None
        if "risk_class" in class_df:
            df_risk = class_df.copy()
            df_risk["risk_class"] = df_risk["risk_class"].replace({"Unknown": "1"})
            drop_classes = ["Not Classified", "Unclassified", "HDE"]
            df_risk = df_risk[~df_risk["risk_class"].isin(drop_classes)]
            if len(df_risk):
                counts = (df_risk["risk_class"].value_counts(normalize=True) * 100).reset_index()
                counts.columns = ["risk_class", "percentage"]
                risk_bar = {
                    "x": counts["risk_class"].tolist(),
                    "y": counts["percentage"].round(2).tolist(),
                    "title": "Risk Class Distribution (%)",
                    "yaxis_title": "Percentage (%)"
                }

        events_scatter = None
        if "num_events" in class_df and "quantity_in_commerce" in class_df:
            events_scatter = {
                "x": class_df["quantity_in_commerce"].astype(float).tolist(),
                "y": class_df["num_events"].astype(float).tolist(),
                "text": class_df[["name", "name_mfr", "country"]].astype(str).apply(lambda row: " | ".join(row.values), axis=1).tolist(),
                "title": "Events vs Quantity in Commerce"
            }

        country_map = None
        if "country" in class_df:
            if "num_events" in class_df:
                country_agg = class_df.groupby("country")["num_events"].sum().reset_index()
            else:
                country_agg = class_df["country"].value_counts().reset_index()
                country_agg.columns = ["country", "num_events"]
            country_agg["iso3"] = country_agg["country"].apply(lambda c: country_to_iso3(c) or "")
            country_map = country_agg[country_agg["iso3"] != ""].to_dict(orient="records")

        mfr_bar = None
        if "name_mfr" in class_df:
            mfr_df = class_df["name_mfr"].value_counts().head(10).reset_index()
            mfr_df.columns = ["Manufacturer", "Count"]
            mfr_bar = {"x": mfr_df["Count"].tolist(), "y": mfr_df["Manufacturer"].tolist(), "orientation": "h", "title": "Top Manufacturers"}

        trend_scatter = None
        if "days_since_last_event" in class_df and "num_events" in class_df:
            trend_scatter = {
                "x": class_df["days_since_last_event"].astype(float).tolist(),
                "y": class_df["num_events"].astype(float).tolist(),
                "text": class_df[["name", "name_mfr"]].astype(str).apply(lambda row: " | ".join(row.values), axis=1).tolist(),
                "title": "Event Recency vs Number of Events"
            }

        sample_data = class_df.head(100).to_dict(orient="records")

        response = {
            "kpis": {
                "total_devices": total_devices,
                "recall_rate": round(recall_rate, 2),
                "avg_events": round(avg_events, 2),
                "safe_devices": safe_devices,
                "high_risk_pct": round(high_risk_pct, 2),
                "failure_risk_score": round(failure_risk_score, 2),
                "failure_cause": failure_cause,
                "risky_country": risky_country,
                "top_mfrs": top_mfrs
            },
            "charts": {
                "recall_pie": recall_pie,
                "risk_bar": risk_bar,
                "events_scatter": events_scatter,
                "country_map": country_map,
                "mfr_bar": mfr_bar,
                "trend_scatter": trend_scatter
            },
            "filtered_data_sample": sample_data
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- New Prediction Endpoint -----------------
@app.route("/predict-risk", methods=["POST"])
def predict_risk():
    try:
        payload = request.get_json()
        device_class = payload.get("classification")
        manufacturer = payload.get("name_mfr")
        country = payload.get("country")
        quantity_in_commerce = payload.get("quantity_in_commerce")
        num_events = payload.get("num_events")

        input_data_text = {
            "classification": device_class,
            "name_mfr": manufacturer,
            "country": country,
            "quantity_in_commerce": quantity_in_commerce,
            "num_events": num_events
        }

        input_df = pd.DataFrame([input_data_text])

        categorical_cols = ["classification", "name_mfr", "country"]
        for col in categorical_cols:
            if col in input_df.columns:
                input_df[col] = input_df[col].apply(lambda v: safe_label_transform(col, v))

        X_for_pred = input_df.copy()
        try:
            if hasattr(predictor, "feature_names_in_"):
                feat_names = list(getattr(predictor, "feature_names_in_"))
                df_pred = pd.DataFrame(columns=feat_names)
                for c in feat_names:
                    if c in X_for_pred.columns:
                        df_pred[c] = X_for_pred[c]
                    else:
                        df_pred[c] = 0
                X_for_pred = df_pred
            else:
                if hasattr(predictor, "n_features_in_"):
                    n_req = int(getattr(predictor, "n_features_in_"))
                    if X_for_pred.shape[1] < n_req:
                        for i in range(n_req - X_for_pred.shape[1]):
                            X_for_pred[f"_pad_{i}"] = 0
                    if X_for_pred.shape[1] > n_req:
                        X_for_pred = X_for_pred.iloc[:, :n_req]
        except Exception as e:
            print(f"Feature alignment fallback used: {e}")

        try:
            X_numeric = X_for_pred.astype(float).values
        except Exception:
            X_numeric = X_for_pred.applymap(lambda v: float(v) if isinstance(v, (int, float)) else float(abs(hash(str(v))) % 1000)).values

        try:
            raw_pred = predictor.predict(X_numeric)
        except Exception as e:
            print(f"Model predict failed. Using heuristic predictor. ({e})")
            heuristic_predictor = HeuristicPredictor()
            raw_pred = heuristic_predictor.predict(X_for_pred)

        if isinstance(raw_pred, (list, tuple, np.ndarray)):
            pred_val_raw = int(np.array(raw_pred).ravel()[0])
        else:
            pred_val_raw = int(raw_pred)

        pred_val = pred_val_raw
        try:
            if hasattr(predictor, "classes_"):
                classes = np.array(getattr(predictor, "classes_"))
                if classes.dtype.kind in ("i", "u") and classes.min() == 0:
                    if pred_val_raw >= 0:
                        pred_val = pred_val_raw + 1
            else:
                if 0 <= pred_val_raw <= 2:
                    pred_val = pred_val_raw + 1
        except Exception:
            pred_val = pred_val_raw

        explanation = None
        prompt = f"""
You are a medical device risk specialist.
A predictive model has assigned this device a risk class of {pred_val}.
Device details:
{chr(10).join([f'{k}: {v}' for k, v in input_data_text.items()])}

Provide a short professional explanation (2-4 lines) of why this risk class might have been assigned.
"""
        if HAS_GROQ and GROQ_API_KEY:
            try:
                llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0.25, api_key=GROQ_API_KEY)
                res = llm.invoke([HumanMessage(content=prompt)])
                explanation = res.content if hasattr(res, "content") else str(res)
                explanation = explanation.strip()
            except Exception as e:
                explanation = f"(LLM failed: {e}) Short reason: many reported events or poor market controls."
        else:
            explanation = "Automated explanation not available (LLM disabled). Likely contributing factors: reported events, manufacturer history, and market exposure."

        return jsonify({
            "predicted_class": pred_val,
            "raw_model_output": pred_val_raw,
            "explanation": explanation,
            "input_data": input_data_text
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- New Appointment Booking Endpoint -----------------
@app.route("/book-appointment", methods=["POST"])
def book_appointment():
    try:
        payload = request.get_json()
        user_name = payload.get("userName")
        user_email = payload.get("userEmail")
        appointment_date_str = payload.get("appointmentDate")
        input_data_text = payload.get("inputDataText", {}) # Device details from prediction
        explanation = payload.get("explanation", "No explanation provided.")

        try:
            appt_dt = datetime.strptime(appointment_date_str.strip(), "%d/%m/%y")
        except Exception as e:
            return jsonify({"error": f"Appointment date parsing failed. Use DD/MM/YY format. ({e})"}), 400

        event_link = f"https://calendar.google.com/calendar/r/day/{appt_dt.year}/{appt_dt.month:02d}/{appt_dt.day:02d}"

        user_body = f"""Hello {user_name},

Your device has been flagged for additional attention.

Appointment details:
Date: {appt_dt.strftime('%A, %d %B %Y')}
Device: {input_data_text.get('classification', 'N/A')}
Manufacturer: {input_data_text.get('name_mfr', 'N/A')}
Country: {input_data_text.get('country', 'N/A')}
Quantity in commerce: {input_data_text.get('quantity_in_commerce', 'N/A')}
Reported events: {input_data_text.get('num_events', 'N/A')}

Calendar link: {event_link}

Regards,
Automated Booking System
"""
        mfr_body = f"""Manufacturer team,

A device failure / elevated risk has been detected and an appointment has been scheduled.

User: {user_name} ({user_email})
Device: {input_data_text.get('classification', 'N/A')}
Manufacturer: {input_data_text.get('name_mfr', 'N/A')}
Country: {input_data_text.get('country', 'N/A')}
Quantity in commerce: {input_data_text.get('quantity_in_commerce', 'N/A')}
Reported events: {input_data_text.get('num_events', 'N/A')}

AI Explanation:
{explanation}

Appointment date: {appt_dt.strftime('%A, %d %B %Y')}
Calendar link: {event_link}

Please reach out to the user for remediation.
"""

        ok1, err1 = send_email(user_email, "Appointment Confirmed - Medical Device", user_body)
        ok2, err2 = send_email(MANUFACTURER_EMAIL, "Device Failure / Appointment Scheduled", mfr_body)

        if ok1 and ok2:
            return jsonify({
                "message": "Appointment created and emails sent successfully.",
                "eventLink": event_link
            }), 200
        else:
            errors = []
            if not ok1: errors.append(f"User email error: {err1}")
            if not ok2: errors.append(f"Manufacturer email error: {err2}")
            return jsonify({"error": "Failed to send one or more emails.", "details": errors}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)