import React from "react";
import { motion } from "framer-motion";
import { ClipboardList, Settings, Database, Brain, Brush, Eye } from "lucide-react";

const features = [
    {
        id: 1,
        title: "Business Understanding",
        desc: "Ask relevant questions and define objectives for the problem that needs to be tackled.",
        icon: ClipboardList,
    },
    {
        id: 2,
        title: "Feature Engineering",
        desc: "Select important features and construct more meaningful ones using the raw data you have.",
        icon: Settings,
    },
    {
        id: 3,
        title: "Data Mining",
        desc: "Gather and scrape the data necessary for the project efficiently.",
        icon: Database,
    },
    {
        id: 4,
        title: "Predictive Modeling",
        desc: "Train machine learning models, evaluate their performance, and use them to make predictions.",
        icon: Brain,
    },
    {
        id: 5,
        title: "Data Cleaning",
        desc: "Fix inconsistencies within the data and handle missing values effectively.",
        icon: Brush,
    },
    {
        id: 6,
        title: "Data Visualization",
        desc: "Communicate findings with stakeholders using plots and interactive visualizations.",
        icon: Eye,
    },
];

const Features = () => {
    return (
        <section className="py-20 bg-white">
            <h2 className="text-6xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-12">
                Our Process
            </h2>
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.id}
                        className="bg-white border border-blue-100 p-6 rounded-xl shadow-md hover:shadow-xl transition"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                        <h3 className="text-xl font-semibold text-blue-700 mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-gray-600">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Features;
