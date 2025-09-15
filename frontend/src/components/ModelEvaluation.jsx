// src/components/ModelEvaluation.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MdOutlineScience, MdFactory, MdPublic, MdShoppingCart,
  MdBarChart, MdCheckCircle, MdWarning, MdError,
  MdDateRange, MdPerson, MdEmail, MdEventAvailable,
  MdUploadFile, MdLightbulbOutline, MdCalendarMonth,
  MdDashboard, MdCrisisAlert, MdHealing, MdInfoOutline,
  MdDevicesOther,
  MdInsights, 
} from 'react-icons/md';
import { FaSpinner } from 'react-icons/fa';
import Header from './home/Header';

const API_BASE_URL = 'http://localhost:5000'; 

const ModelEvaluation = () => {
  const [file, setFile] = useState(null);
  const [classifications, setClassifications] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [uploadedData, setUploadedData] = useState(null);

  const [deviceClass, setDeviceClass] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [country, setCountry] = useState('');
  const [quantityInCommerce, setQuantityInCommerce] = useState(500);
  const [numEvents, setNumEvents] = useState(3);

  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [userName, setUserName] = useState('Name');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: '2-digit'
    })
  );
  const [bookingMessage, setBookingMessage] = useState(null);

  useEffect(() => {
    // If you had default data for dropdowns, you'd fetch it here.
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file to upload.");
      return;
    }
    setLoading(true);
    setError(null);
    setPredictionResult(null);
    setBookingMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/process-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setClassifications(response.data.classifications);
      setManufacturers(response.data.manufacturers);
      setCountries(response.data.countries);
      setUploadedData(response.data.data);
      setError(null);

      if (response.data.classifications.length > 0) setDeviceClass(response.data.classifications[0]);
      if (response.data.manufacturers.length > 0) setManufacturer(response.data.manufacturers[0]);
      if (response.data.countries.length > 0) setCountry(response.data.countries[0]);

    } catch (err) {
      console.error("File upload error:", err);
      setError("Failed to upload or process CSV. Check console for details. Ensure Flask backend is running.");
      setClassifications([]);
      setManufacturers([]);
      setCountries([]);
      setUploadedData(null);
      setDeviceClass('');
      setManufacturer('');
      setCountry('');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictRisk = async (e) => {
    e.preventDefault();
    if (!deviceClass || !manufacturer || !country) {
      setError("Please select all device details.");
      return;
    }
    setLoading(true);
    setError(null);
    setPredictionResult(null);
    setBookingMessage(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict-risk`, {
        classification: deviceClass,
        name_mfr: manufacturer,
        country: country,
        quantity_in_commerce: quantityInCommerce,
        num_events: numEvents,
      });
      setPredictionResult(response.data);
      setError(null);
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Failed to get risk prediction. Check console for details. Ensure Flask backend is running and model/encoders are present.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!userName || !userEmail || !appointmentDate || !predictionResult) {
      setError("Please fill all appointment details and predict risk first.");
      return;
    }
    setLoading(true);
    setError(null);
    setBookingMessage(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/book-appointment`, {
        userName,
        userEmail,
        appointmentDate,
        inputDataText: predictionResult.input_data,
        explanation: predictionResult.explanation,
      });
      setBookingMessage(response.data.message + ` Simulated event link: ${response.data.eventLink}`);
      setError(null);
    } catch (err) {
      console.error("Booking error:", err);
      const errorDetails = err.response?.data?.details?.join(', ') || err.response?.data?.error || err.message;
      setError(`Failed to send one or more emails. Details: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColorClass = (risk) => {
    if (risk === 1) return "text-green-700 bg-green-100 border-green-300";
    if (risk === 2) return "text-orange-700 bg-orange-100 border-orange-300"; // Changed yellow to orange for better contrast
    if (risk === 3) return "text-red-700 bg-red-100 border-red-300";
    return "text-gray-700 bg-gray-100 border-gray-300";
  };

  const getRiskIcon = (risk) => {
    if (risk === 1) return <MdCheckCircle className="text-green-500 text-3xl" />;
    if (risk === 2) return <MdWarning className="text-orange-500 text-3xl" />;
    if (risk === 3) return <MdError className="text-red-500 text-3xl" />;
    return <MdInfoOutline className="text-gray-500 text-3xl" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
      <Header /> {/* Header component */}
      <div className="container mx-auto px-4 py-8 pt-24"> {/* Added pt-24 to account for fixed header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-indigo-800 drop-shadow-lg flex items-center justify-center gap-4">
            <img src="meddevicelogo.png" alt="" className='h-20 w-26 animate-pulse'/> Medical Device Risk Dashboard
          </h1>
          <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
            A comprehensive platform for evaluating medical device risk and managing expert consultations.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Section */}
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-xl border border-blue-100 transform hover:scale-102 transition-all duration-300 ease-in-out">
            <h2 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-3">
              <img src="datainput.png" alt="" className='size-14'/> Data Input
            </h2>
            <p className="text-gray-600 mb-6">Start by uploading your medical device data in CSV format to populate the selection fields.</p>
            <form onSubmit={handleFileUpload} className="space-y-6">
              <label className="block">
                <span className="sr-only">Choose file</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-lg text-gray-700
                           file:mr-4 file:py-3 file:px-6
                           file:rounded-full file:border-0
                           file:text-lg file:font-semibold
                           file:bg-indigo-100 file:text-indigo-700
                           hover:file:bg-indigo-200 cursor-pointer transition-colors duration-200"
                />
              </label>
              {file && <p className="mt-2 text-sm text-gray-500">Selected: <span className="font-medium text-indigo-700">{file.name}</span></p>}
              <button
                type="submit"
                className="w-full flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all duration-300 shadow-lg text-xl transform hover:-translate-y-1"
                disabled={loading}
              >
                {loading ? <FaSpinner className="animate-spin text-2xl mr-3" /> : <MdDashboard className="text-2xl mr-3" />}
                {loading ? 'Processing Data...' : 'Upload & Process CSV'}
              </button>
            </form>
          </div>

          {/* Device Details & Risk Prediction */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-xl border border-green-100 transform hover:scale-102 transition-all duration-300 ease-in-out">
            <h2 className="text-3xl font-bold text-teal-700 mb-6 flex items-center gap-3">
              <img src="risklogo.png" alt="" className='size-14'/> Risk Evaluation
            </h2>
            <p className="text-gray-600 mb-6">Select device parameters to predict its safety risk and view AI-driven explanations.</p>
            <form onSubmit={handlePredictRisk} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Device Class */}
              <div>
                <label htmlFor="deviceClass" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdDevicesOther className="text-gray-500" /> Device Class
                </label>
                <select
                  id="deviceClass"
                  value={deviceClass}
                  onChange={(e) => setDeviceClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-base appearance-none cursor-pointer"
                  disabled={classifications.length === 0 || loading}
                >
                  <option value="">-- Select Device Class --</option>
                  {classifications.map((cls, index) => (
                    <option key={index} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              {/* Manufacturer */}
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdFactory className="text-gray-500" /> Manufacturer
                </label>
                <select
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-base appearance-none cursor-pointer"
                  disabled={manufacturers.length === 0 || loading}
                >
                  <option value="">-- Select Manufacturer --</option>
                  {manufacturers.map((mfr, index) => (
                    <option key={index} value={mfr}>{mfr}</option>
                  ))}
                </select>
              </div>
              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdPublic className="text-gray-500" /> Country of Origin
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-base appearance-none cursor-pointer"
                  disabled={countries.length === 0 || loading}
                >
                  <option value="">-- Select Country --</option>
                  {countries.map((c, index) => (
                    <option key={index} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Quantity in Commerce */}
              <div>
                <label htmlFor="quantityInCommerce" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdShoppingCart className="text-gray-500" /> Quantity in Commerce
                </label>
                <input
                  type="number"
                  id="quantityInCommerce"
                  value={quantityInCommerce}
                  onChange={(e) => setQuantityInCommerce(Number(e.target.value))}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-base"
                  disabled={loading}
                />
              </div>
              {/* Number of Events */}
              <div>
                <label htmlFor="numEvents" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdCrisisAlert className="text-gray-500" /> Number of Adverse Events
                </label>
                <input
                  type="number"
                  id="numEvents"
                  value={numEvents}
                  onChange={(e) => setNumEvents(Number(e.target.value))}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-base"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2 flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-10 py-4 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all duration-300 shadow-lg text-xl transform hover:-translate-y-1 flex items-center justify-center"
                  disabled={loading || !uploadedData}
                >
                  {loading ? <FaSpinner className="animate-spin text-2xl mr-3" /> : <MdBarChart className="text-2xl mr-3" />}
                  {loading ? 'Predicting Risk...' : 'Predict Device Risk'}
                </button>
              </div>
            </form>

            {predictionResult && (
              <div className="mt-10 p-7 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-inner border border-gray-200 animate-fade-in">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <img src="predictionlogo.png" alt="" className='size-14'/> Prediction Outcome
                </h3>
                <div className={`p-5 rounded-lg flex flex-col md:flex-row items-center gap-4 border-2 ${getRiskColorClass(predictionResult.predicted_class)}`}>
                  {getRiskIcon(predictionResult.predicted_class)}
                  <div>
                    <span className="font-extrabold text-2xl">
                      Risk Class: {predictionResult.predicted_class}
                      {predictionResult.predicted_class === 1 && " (Low Risk)"}
                      {predictionResult.predicted_class === 2 && " (Medium Risk)"}
                      {predictionResult.predicted_class === 3 && " (High Risk)"}
                    </span>
                    <p className="text-lg mt-1">Based on the provided device characteristics.</p>
                  </div>
                </div>
                <div className="mt-6 p-5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-start gap-4 shadow-sm">
                  <MdLightbulbOutline className="text-indigo-600 text-3xl mt-1" />
                  <div>
                    <h4 className="font-bold text-indigo-800 text-lg">AI-Powered Explanation:</h4>
                    <p className="text-gray-700 leading-relaxed text-md">{predictionResult.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Booking Section (Conditional) */}
          {predictionResult && predictionResult.predicted_class > 1 && (
            <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-xl border border-purple-100 mt-8 transform hover:scale-101 transition-all duration-300 ease-in-out w-1/2 ml-96">
              <h2 className="text-3xl font-bold text-purple-700 mb-6 flex items-center gap-3">
                <img src="calendar.png" alt="" className='size-14'/> Schedule Consultation
              </h2>
              <p className="text-gray-600 mb-6">
                An expert consultation is recommended for devices categorized as Medium or High risk.
                Please provide your details to book an appointment.
              </p>
              <form onSubmit={handleBookAppointment} className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MdPerson className="text-gray-500" /> Your Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
                  />
                </div>
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MdEmail className="text-gray-500" /> Your Email
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
                  />
                </div>
                <div>
                  <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MdDateRange className="text-gray-500" /> Preferred Date (DD/MM/YY)
                  </label>
                  <input
                    type="text"
                    id="appointmentDate"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    placeholder="DD/MM/YY"
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
                  />
                </div>
                <div className="md:col-span-3 flex justify-center mt-4">
                  <button
                    type="submit"
                    className="px-10 py-4 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-all duration-300 shadow-lg text-xl transform hover:-translate-y-1 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="animate-spin text-2xl mr-3" /> : <MdCalendarMonth className="text-2xl mr-3" />}
                    {loading ? 'Booking Appointment...' : 'Book Appointment & Send Emails'}
                  </button>
                </div>
              </form>
              {bookingMessage && (
                <div className="mt-8 p-5 rounded-lg bg-green-50 border border-green-300 text-green-800 flex items-start gap-4 shadow-md animate-fade-in">
                  <MdCheckCircle className="text-green-600 text-3xl mt-1" />
                  <div>
                    <h4 className="font-bold text-lg">Appointment Confirmed!</h4>
                    <p className="font-medium text-md leading-relaxed">{bookingMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="lg:col-span-3 p-6 rounded-xl bg-red-50 border border-red-300 text-red-800 flex items-start gap-4 mt-8 shadow-md animate-fade-in">
              <MdError className="text-red-600 text-3xl mt-1" />
              <div>
                <h3 className="font-bold text-lg">Operation Failed:</h3>
                <p className="text-md leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelEvaluation;