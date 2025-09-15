import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Brain, Zap, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleOptionClick = (option) => {
        setIsModalOpen(false);
        if (option === "dashboard") navigate("/dashboard");
        if (option === "model") navigate("/model-evaluation");
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-gray-100 to-blue-50 mt-10">
            {/* Subtle Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(200,200,200,.1)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-[slide_20s_linear_infinite]" />
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-6 text-center">
                <motion.div
                    className="max-w-5xl mx-auto"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <motion.h1
                        className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        Predict Equipment Failure
                        <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                            Before It Happens
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                    >
                        Leverage advanced AI and machine learning to predict medical
                        equipment failures, ensuring patient safety and minimizing downtime
                        through proactive maintenance.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        <motion.button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-blue-400/30 transition-all duration-300 flex items-center space-x-2"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Get Started</span>
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </motion.div>

                    {/* Feature Cards */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    >
                        {[
                            {
                                icon: Brain,
                                title: "AI-Powered Analysis",
                                description:
                                    "Advanced machine learning algorithms analyze patterns in medical device data",
                                image: "hero1.png",
                            },
                            {
                                icon: Shield,
                                title: "Patient Safety First",
                                description:
                                    "Proactive failure detection ensures continuous patient care and safety",
                                image: "hero2.png",
                            },
                            {
                                icon: Zap,
                                title: "Real-time Monitoring",
                                description:
                                    "Continuous monitoring and instant alerts for critical equipment status",
                                image: "hero3.png",
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
                                whileHover={{ scale: 1.02, y: -5 }}
                            >
                                <div className="w-12 h-12 bg-gradient-to-r from-white/50 to-gray-200 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                    <img src={feature.image} alt="SubLogo" className="size-12" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Popup Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button
                                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                Choose an Option
                            </h2>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => handleOptionClick("dashboard")}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-4xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <img src="dashboard.png" alt="" className="size-10"/>
                                     Go to Dashboard
                                </button>
                                <button
                                    onClick={() => handleOptionClick("model")}
                                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-4xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <img src="model.png" alt="" className="size-10" />
                                     Model Evaluation
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Hero;
