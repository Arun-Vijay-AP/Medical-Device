import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import Header from "./home/Header";
import { FiUpload, FiGrid, FiBarChart2, FiPieChart, FiMap, FiActivity, FiLayers, FiList } from "react-icons/fi"; // Added FiList for classifications

const API_BASE = "http://127.0.0.1:5000";

const StatCard = ({ title, value, subtitle, icon: Icon, className = "" }) => (
    <div className={`relative bg-white rounded-xl shadow-lg p-5 flex flex-col justify-between ${className}`}>
        {Icon && <Icon className="absolute top-4 right-4 text-indigo-200 text-3xl opacity-60" />}
        <div className="text-sm font-medium text-gray-500 z-10">{title}</div>
        <div className="mt-2 text-3xl font-bold text-gray-800 z-10">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1 z-10">{subtitle}</div>}
    </div>
);

const Dashboard = () => {
    const [filePreview, setFilePreview] = useState([]);
    const [classifications, setClassifications] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setErr("");
        setLoading(true);
        setDashboard(null);
        setSelectedClass("");

        try {
            const form = new FormData();
            form.append("file", file);

            const res = await axios.post(`${API_BASE}/process-csv`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.error) throw new Error(res.data.error);

            setFilePreview(res.data.preview || []);
            setClassifications(res.data.classifications || []);
            setCsvData(res.data.data || []);
        } catch (error) {
            console.error(error);
            setErr(error.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboard = async (classification) => {
        if (!classification) return;
        setErr("");
        setLoading(true);
        setDashboard(null);
        setSelectedClass(classification);

        try {
            const res = await axios.post(`${API_BASE}/get-dashboard`, {
                classification,
                csv_data: csvData,
            });

            if (res.data.error) throw new Error(res.data.error);
            setDashboard(res.data);
            // Scroll to results
            setTimeout(() => {
                const el = document.getElementById("dashboard-results");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        } catch (error) {
            console.error(error);
            setErr(error.message || "Failed to compute dashboard");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 font-sans pt-12"> {/* Added pt-12 for header spacing */}
            <Header />
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
                {/* Main Control Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-indigo-100">
                    <h1 className="text-4xl font-extrabold text-indigo-700 mb-3 flex items-center">
                        <img src="dashmed.png" alt="" className="size-24"/>Medical Device Insights
                    </h1>
                    <p className="text-md text-gray-600 mb-6 max-w-2xl">
                        Upload your medical device dataset (CSV) to unlock key performance indicators, interactive charts, and detailed analytics for different device classifications.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Left Column - File Upload + CSV Preview */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            {/* File Upload Section */}
                            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-200 flex flex-col">
                                <label htmlFor="file-upload" className="block text-lg font-semibold text-indigo-700 mb-3 flex items-center">
                                    <FiUpload className="mr-2" /> Upload CSV Dataset
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-700
                                               file:mr-4 file:py-2 file:px-4
                                               file:rounded-full file:border-0
                                               file:text-sm file:font-semibold
                                             file:bg-indigo-600 file:text-white
                                             hover:file:bg-indigo-700 cursor-pointer transition-colors duration-200"
                                />
                                {loading && (
                                    <div className="flex items-center text-indigo-600 mt-4 animate-pulse">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing file...
                                    </div>
                                )}
                                {err && <div className="text-red-600 mt-4 text-sm font-medium">{err}</div>}
                            </div>

                            {/* CSV Preview (directly below) */}
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-400 flex flex-col h-auto">
                                <div className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                    <FiLayers className="mr-2" /> CSV Data Preview
                                </div>
                                {filePreview.length > 0 ? (
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-grow">
                                        <div className="overflow-x-auto max-h-48 custom-scrollbar">
                                            <table className="min-w-full text-left text-sm table-auto">
                                                <thead className="sticky top-0 bg-white">
                                                    <tr>
                                                        {Object.keys(filePreview[0] || {}).slice(0, 5).map((h, idx) => (
                                                            <th key={idx} className="px-4 py-2 text-gray-500 font-semibold border-b border-gray-200 whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filePreview.slice(0, 5).map((row, rIdx) => (
                                                        <tr key={rIdx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                                                            {Object.keys(filePreview[0] || {}).slice(0, 5).map((h, cIdx) => (
                                                                <td key={cIdx} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                                                                    {String(row[h]).length > 20 ? String(row[h]).slice(0, 17) + "..." : String(row[h])}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">
                                        Upload a CSV to see a preview of your data.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Classification Section (Full Height, Full Width) */}
                        <div className="lg:col-span-2 p-6 bg-gray-50 rounded-2xl border border-gray-400 flex flex-col justify-between h-full">
                            <label className="block text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                <FiList className="mr-2" /> Select Classification
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {classifications.length === 0 ? (
                                    <div className="text-sm text-gray-500 py-4">Upload a CSV to see classifications.</div>
                                ) : (
                                    classifications.map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => fetchDashboard(c)}
                                            className={`px-4 py-4 rounded-full text-xs font-medium shadow-sm
                                                    ${selectedClass === c
                                                    ? "bg-indigo-600 text-white shadow-indigo-300 transform scale-105"
                                                    : "bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                                                } transition-all duration-200 ease-in-out`}
                                        >
                                            {c}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Dashboard results */}
                {dashboard && (
                    <div id="dashboard-results" className="space-y-8 animate-fade-in">
                        {/* KPI Cards Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Devices" value={dashboard.kpis.total_devices} icon={FiBarChart2} />
                            <StatCard title="Failure Risk Score" value={`${dashboard.kpis.failure_risk_score}/100`} icon={FiActivity} className="bg-gradient-to-r from-red-50 to-orange-50" />
                            <StatCard title="Safe Devices" value={dashboard.kpis.safe_devices} icon={FiGrid} className="bg-gradient-to-r from-green-50 to-blue-50" />
                            <StatCard title="Recall Rate" value={`${dashboard.kpis.recall_rate}%`} subtitle={`High risk: ${dashboard.kpis.high_risk_pct}%`} icon={FiPieChart} className="bg-gradient-to-r from-yellow-50 to-pink-50" />
                        </div>

                        {/* Secondary KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
                                <div className="text-sm font-medium text-gray-500">Country Risk Spotlight</div>
                                <div className="mt-2 text-xl font-semibold text-gray-800">{dashboard.kpis.risky_country || "N/A"}</div>
                                <p className="text-xs text-gray-400 mt-1">Country with highest average risk</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
                                <div className="text-sm font-medium text-gray-500">Top Manufacturers</div>
                                <div className="mt-2 text-xl font-semibold text-gray-800">{dashboard.kpis.top_mfrs?.slice(0, 2).join(", ") || "N/A"}</div>
                                <p className="text-xs text-gray-400 mt-1">Leading manufacturers by event count</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
                                <div className="text-sm font-medium text-gray-500">Top Failure Cause</div>
                                <div className="mt-2 text-xl font-semibold text-gray-800 capitalize">{dashboard.kpis.failure_cause || "N/A"}</div>
                                <p className="text-xs text-gray-400 mt-1">Most frequent keyword in event descriptions</p>
                            </div>
                        </div>

                        {/* Charts grid - now 3 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Changed to lg:grid-cols-3 */}
                            {/* Recall pie (donut) */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col">
                                <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FiPieChart className="mr-2 text-indigo-500" /> Recall Distribution
                                </div>
                                {dashboard.charts.recall_pie ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <Plot
                                            data={[
                                                {
                                                    labels: dashboard.charts.recall_pie.labels,
                                                    values: dashboard.charts.recall_pie.values,
                                                    type: "pie",
                                                    hole: dashboard.charts.recall_pie.hole || 0.4,
                                                    hoverinfo: "label+percent+value",
                                                    textinfo: "percent",
                                                    marker: {
                                                        colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
                                                    },
                                                    textfont: { size: 12, color: '#ffffff' }, // Slightly smaller text on slices
                                                },
                                            ]}
                                            layout={{
                                                margin: { t: 0, b: 0, l: 0, r: 0 },
                                                height: 300, // Reduced height for 3-column layout
                                                showlegend: true,
                                                legend: { orientation: "h", yanchor: "bottom", y: -0.2, xanchor: "center", x: 0.5, font: { size: 10 } }, // Smaller legend font
                                            }}
                                            config={{ displayModeBar: false }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">Not enough data for recall chart</div>
                                )}
                            </div>

                            {/* Risk class bar */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col">
                                <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FiBarChart2 className="mr-2 text-indigo-500" /> Risk Class Distribution (%)
                                </div>
                                {dashboard.charts.risk_bar ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <Plot
                                            data={[
                                                {
                                                    x: dashboard.charts.risk_bar.x,
                                                    y: dashboard.charts.risk_bar.y,
                                                    type: "bar",
                                                    marker: { color: '#6366F1' },
                                                },
                                            ]}
                                            layout={{
                                                xaxis: { title: "Risk Class", tickfont: { size: 10 } }, // Smaller tick font
                                                yaxis: { title: dashboard.charts.risk_bar.yaxis_title || "Percentage (%)", tickfont: { size: 10 } },
                                                margin: { t: 20, r: 20, l: 40, b: 50 }, // Adjusted margins
                                                height: 300, // Reduced height
                                            }}
                                            config={{ displayModeBar: false }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">Not enough data for risk classes</div>
                                )}
                            </div>

                            {/* Events vs Quantity scatter */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col">
                                <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FiActivity className="mr-2 text-indigo-500" /> Events vs Quantity
                                </div>
                                {dashboard.charts.events_scatter ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <Plot
                                            data={[
                                                {
                                                    x: dashboard.charts.events_scatter.x,
                                                    y: dashboard.charts.events_scatter.y,
                                                    mode: "markers",
                                                    type: "scatter",
                                                    text: dashboard.charts.events_scatter.text,
                                                    marker: { size: 8, color: '#60A5FA', opacity: 0.7 },
                                                    hoverinfo: 'text',
                                                },
                                            ]}
                                            layout={{
                                                xaxis: { title: "Quantity in Commerce", tickfont: { size: 10 } },
                                                yaxis: { title: "Number of Events", tickfont: { size: 10 } },
                                                height: 300, // Reduced height
                                                margin: { t: 20, r: 20, l: 40, b: 50 },
                                            }}
                                            config={{ displayModeBar: false }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">Not enough data for events vs quantity</div>
                                )}
                            </div>

                            {/* Country map (choropleth) */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col">
                                <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FiMap className="mr-2 text-indigo-500" /> Country Distribution
                                </div>
                                {dashboard.charts.country_map && dashboard.charts.country_map.length ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <Plot
                                            data={[
                                                {
                                                    type: "choropleth",
                                                    locations: dashboard.charts.country_map.map((r) => r.iso3),
                                                    z: dashboard.charts.country_map.map((r) => Number(r.num_events) || 0),
                                                    text: dashboard.charts.country_map.map((r) => r.country),
                                                    colorscale: 'Portland',
                                                    colorbar: { title: '# Events', len: 0.5, y: 0.5, x: 1.05, thickness: 15, tickfont: { size: 10 } }, // Adjusted colorbar for space
                                                    autocolorscale: false,
                                                    marker: { line: { color: 'rgb(180,180,180)', width: 0.5 } }
                                                },
                                            ]}
                                            layout={{
                                                geo: {
                                                    projection: { type: "natural earth" },
                                                    showland: true,
                                                    landcolor: 'rgb(243, 243, 243)',
                                                    countrycolor: 'rgb(204, 204, 204)',
                                                },
                                                height: 300, // Reduced height
                                                margin: { t: 20, r: 0, l: 0, b: 20 },
                                            }}
                                            config={{ displayModeBar: false }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">Country ISO3 mapping unavailable or insufficient data</div>
                                )}
                            </div>

                            {/* Manufacturers bar */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col">
                                <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FiBarChart2 className="mr-2 text-indigo-500" /> Top Manufacturers
                                </div>
                                {dashboard.charts.mfr_bar ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <Plot
                                            data={[
                                                {
                                                    x: dashboard.charts.mfr_bar.y,
                                                    y: dashboard.charts.mfr_bar.x,
                                                    type: "bar",
                                                    orientation: "h",
                                                    marker: { color: '#818CF8' },
                                                },
                                            ]}
                                            layout={{
                                                xaxis: { title: "# Events", tickfont: { size: 10 } },
                                                yaxis: { automargin: true, tickfont: { size: 10 } },
                                                margin: { t: 20, r: 20, l: 120, b: 50 }, // Adjusted left margin for labels
                                                height: 300, // Reduced height
                                            }}
                                            config={{ displayModeBar: false }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">Not enough manufacturer data</div>
                                )}
                            </div>

                            {/* Event recency trend */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col">
                                <div className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                    <FiActivity className="mr-2 text-indigo-500" /> Event Recency Trend
                                </div>
                                {dashboard.charts.trend_scatter ? (
                                    <div className="flex-grow flex items-center justify-center">
                                        <Plot
                                            data={[
                                                {
                                                    x: dashboard.charts.trend_scatter.x,
                                                    y: dashboard.charts.trend_scatter.y,
                                                    mode: "markers",
                                                    type: "scatter",
                                                    text: dashboard.charts.trend_scatter.text,
                                                    marker: { size: 7, color: '#34D399', opacity: 0.7 },
                                                    hoverinfo: 'text',
                                                },
                                            ]}
                                            layout={{
                                                xaxis: { title: "Days Since Last Event", tickfont: { size: 10 } },
                                                yaxis: { title: "# Events", tickfont: { size: 10 } },
                                                height: 300, // Reduced height
                                                margin: { t: 20, r: 20, l: 40, b: 50 },
                                            }}
                                            config={{ displayModeBar: false }}
                                            className="w-full h-full"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-md text-gray-400">Not enough data for event recency trend</div>
                                )}
                            </div>
                        </div>

                        {/* Data table */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-lg font-semibold text-gray-700 flex items-center">
                                    <FiLayers className="mr-2 text-indigo-500" /> Sample Data for "{selectedClass}"
                                </div>
                                <div className="text-sm text-gray-500">Showing up to 100 rows for the selected class</div>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar max-h-96">
                                <table className="min-w-full text-sm table-auto">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr>
                                            {(dashboard.filtered_data_sample[0] ? Object.keys(dashboard.filtered_data_sample[0]) : []).map(
                                                (h, idx) => (
                                                    <th key={idx} className="px-4 py-3 text-left text-gray-600 font-semibold border-b border-gray-200 whitespace-nowrap">{h}</th>
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboard.filtered_data_sample.map((row, rIdx) => (
                                            <tr key={rIdx} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                                                {Object.values(row).map((val, cIdx) => (
                                                    <td key={cIdx} className="px-4 py-2.5 text-gray-700">
                                                        {String(val).length > 100 ? String(val).slice(0, 97) + "..." : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Initial state hint */}
                {!dashboard && (
                    <div className="mt-12 p-8 bg-white rounded-2xl shadow-lg border border-indigo-100 text-center text-gray-500">
                        <FiUpload className="mx-auto text-indigo-300 text-6xl mb-4" />
                        <p className="text-xl font-medium text-indigo-700 mb-2">Ready to explore your data?</p>
                        <p className="text-md text-gray-600 max-w-lg mx-auto">
                            Upload a CSV file and select a device classification to generate a dynamic and interactive dashboard filled with insights.
                        </p>
                    </div>
                )}
            </div>
            {/* Custom scrollbar styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1; /* Gray-300 */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8; /* Gray-400 */
                }
            `}</style>
        </div>
    );
};

export default Dashboard;