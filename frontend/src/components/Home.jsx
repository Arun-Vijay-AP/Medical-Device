import React, { useState } from "react";
import Header from "./home/Header";
import Hero from "./home/Hero";
import Team from "./home/Team";
import Features from "./home/Features";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            setError("Invalid file format! Please upload a CSV file.");
            return;
        }

        setError(""); // clear error if any
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const rows = text.split("\n").map((row) => row.split(","));
            const headers = rows[0].map((h) => h.trim());
            const data = rows.slice(1).map((row) => {
                const obj = {};
                row.forEach((value, index) => {
                    obj[headers[index]] = value.trim();
                });
                return obj;
            });

            navigate("/dashboard", { state: { csvData: data } });
        };
        reader.readAsText(file);
    };

    return (
        <div className="relative">
            {/* Header */}
            <Header onUploadClick={() => setShowUpload(true)} />    

            {/* Hero */}
            <Hero onUploadClick={() => setShowUpload(true)} />

            {/* Features */}
            <section id="features" className="py-20 bg-white text-blue-600">
                <div className="container mx-auto px-6">
                    <Features />
                </div>
            </section>

            {/* File Upload Popup */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl p-8 w-[90%] md:w-[500px] relative"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowUpload(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
                                Upload Your CSV File
                            </h2>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-center text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Upload Box */}
                            <label className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 transition cursor-pointer">
                                <p className="text-gray-500">Drag & drop your file here</p>
                                <p className="text-sm text-gray-400">or click to browse</p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </label>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Team Section */}
            <Team />
        </div>
    );
};

export default Home;
