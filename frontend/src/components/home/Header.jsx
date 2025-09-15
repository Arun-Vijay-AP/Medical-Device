import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isDashboard = location.pathname === "/dashboard" || location.pathname === "/model-evaluation"; 

    const navItems = [
        { href: "#home", label: "Home" },
        { href: "#features", label: "Features" },
        { href: "#team", label: "Team" },
    ];

    return (
        <motion.header
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-white"
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-around">
                    {/* LOGO SECTION */}
                    <motion.div
                        className="flex items-center space-x-3 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate("/")}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-white/50 to-white rounded-lg flex items-center justify-center shadow">
                            <img src="medLogo.png" alt="Logo" className="w-10 h-10" />
                        </div>

                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                            {isDashboard ? "Dashboard" : "PRISM"}
                        </span>

                        {/* ✅ Only show "Live Analysis" if on Dashboard */}
                        {isDashboard && (
                            <span className="ml-3 flex items-center space-x-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-green-600 font-medium text-lg">
                                    Live Analysis
                                </span>
                            </span>
                        )}
                    </motion.div>

                    {/* ✅ Nav Menu only visible on Home page */}
                    {!isDashboard && (
                        <nav className="hidden md:flex items-center gap-4 space-x-8">
                            {navItems.map((item) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    className="text-gray-700 hover:text-white transition-colors duration-300 font-medium hover:bg-blue-400 hover:rounded-xl hover:px-3 hover:py-2"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {item.label}
                                </motion.a>
                            ))}
                        </nav>
                    )}

                    {/* Mobile Menu Toggle (Visible on Home) */}
                    {!isDashboard && (
                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    )}
                </div>

                {/* Mobile Navigation (Only on Home) */}
                {!isDashboard && isMobileMenuOpen && (
                    <motion.nav
                        className="md:hidden mt-4 pb-4 bg-white rounded-lg shadow-md"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors duration-300 px-4"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        ))}
                    </motion.nav>
                )}
            </div>
        </motion.header>
    );
};

export default Header;
