import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Twitter, Mail } from 'lucide-react';

const Team = () => {
    const teamMembers = [
        {
            name: 'Hariharan',
            role: 'Lead (ML Model Development)',
            image: 'team/team1.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'hariharan@gamil.com'
            }
        },
        {
            name: 'Arvind Kumar Ponsingh',
            role: 'ML Model Development & LLM Integration',
            image: 'team/team2.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'michael.rodriguez@unknown.ai'
            }
        },
        {
            name: 'Gurucharan Raj',
            role: 'Email Automation with Calendar Integration',
            image: 'team/team3.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'emily.watson@unknown.ai'
            }
        },
        {
            name: 'Arunpranav',
            role: 'Data Pre-Processing & Feature Extraction',
            image: 'team/team4.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'james.park@unknown.ai'
            }
        },
        {
            name: 'Aravinnth',
            role: 'Feature Extraction & LLM Integration',
            image: 'team/team5.png',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'james.park@unknown.ai'
            }
        },
        {
            name: 'Harish',
            role: 'Data visualization & Dashboard',
            image: 'team/team6.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'james.park@unknown.ai'
            }
        },
        {
            name: 'Gnanamoorthi',
            role: 'React UI',
            image: 'team/team7.png',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'james.park@unknown.ai'
            }
        },
        {
            name: 'Aadithyan',
            role: 'React UI & Flask Integration',
            image: 'team/team8.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                email: 'james.park@unknown.ai'
            }
        }
    ];

    return (
        <section id="team" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="container mx-auto px-6">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        Meet Our Team
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        A diverse group of experts passionate about improving healthcare through innovation
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10, scale: 1.02 }}
                        >
                            <motion.div
                                className="relative mb-6"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gradient-to-r from-blue-400 to-purple-400"
                                />
                                <div className="absolute inset-0 w-24 h-24 rounded-full mx-auto bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </motion.div>

                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h3>
                                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>

                                <div className="flex justify-center space-x-3">
                                    {[
                                        { icon: Linkedin, href: member.social.linkedin, color: 'hover:text-blue-600' },
                                        { icon: Twitter, href: member.social.twitter, color: 'hover:text-cyan-500' },
                                        { icon: Mail, href: `mailto:${member.social.email}`, color: 'hover:text-purple-600' },
                                    ].map((social, socialIndex) => (
                                        <motion.a
                                            key={socialIndex}
                                            href={social.href}
                                            className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300 hover:bg-gray-200`}
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <social.icon className="w-5 h-5" />
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;
