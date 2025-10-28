import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import bannerImg from '../../assets/hero-illustration.jpeg';
import serviceImg from '../../assets/service1.jpeg';
import videoConsultIcon from '../../assets/icons/videoConsultIcon.png';
import bookingIcon from '../../assets/icons/bookingIcon.png';
import prescriptionIcon from '../../assets/icons/prescriptionIcon.png';
import realtimeIcon from '../../assets/icons/realtimeIcon.png';

const LandingPage: React.FC = () => {
  const features = [
    {
      title: 'Real-Time Video Consultation',
      icon: videoConsultIcon,
      description: 'Connect instantly with doctors via video calls',
    },
    {
      title: 'Smart Appointment Booking',
      icon: bookingIcon,
      description: 'Schedule & reschedule appointments in seconds',
    },
    {
      title: 'Digital Prescriptions',
      icon: prescriptionIcon,
      description: 'Get e-prescriptions delivered to your mail',
    },
    {
      title: '24/7 Medical Support',
      icon: realtimeIcon,
      description: 'Instant access to healthcare professionals',
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#320A6B] via-[#065084] to-[#0F828C] text-white overflow-hidden">
      <Header />

      <main>
        {/* Hero Section - Enhanced */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 md:px-16 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <motion.div
                className="w-full lg:w-1/2"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative">
                  <motion.span
                    className="inline-block px-4 py-2 bg-gradient-to-r from-[#78B9B5] to-[#0F828C] rounded-full text-sm font-semibold mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    🚀 Virtual Healthcare
                  </motion.span>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
                    <span className="bg-gradient-to-r from-[#78B9B5] to-white bg-clip-text text-transparent">
                      Consult Doctors
                    </span>{' '}
                    <span className="text-white">Online</span>
                  </h1>
                  <p className="text-xl md:text-2xl text-[#B7DEE6] mb-8 leading-relaxed font-light">
                    Real-time video consultations, instant appointments, and
                    digital prescriptions. Healthcare at your fingertips.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/patient/find-doctor"
                      className="group inline-flex items-center bg-gradient-to-r from-[#78B9B5] to-[#0F828C] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-[#0F828C] hover:to-[#78B9B5] transition-all duration-300 shadow-2xl hover:shadow-[#78B9B5]/25 transform hover:-translate-y-1"
                    >
                      <span>Start Consultation</span>
                      <svg
                        className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="w-full lg:w-1/2"
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative">
                  <motion.img
                    src={bannerImg}
                    alt="Virtual Doctor Consultation"
                    className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
                    whileHover={{ scale: 1.02, rotate: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#78B9B5]/20 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-[#0F828C]/20 rounded-full animate-pulse delay-1000"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-[#320A6B]/10">
          <div className="container mx-auto px-4 md:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-6">
                Why Choose Us?
              </h2>
              <p className="text-xl text-[#B7DEE6] max-w-2xl mx-auto">
                Experience healthcare like never before with our cutting-edge
                virtual consultation platform
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="group bg-[#065084]/20 backdrop-blur-sm p-8 rounded-2xl border border-[#78B9B5]/20 hover:border-[#78B9B5]/40 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[#78B9B5] to-[#0F828C] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <img
                      src={feature.icon || serviceImg}
                      alt={feature.title}
                      // className="w-8 h-8"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-[#B7DEE6] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section - UPDATED WITH 4 STEPS */}
        <section className="py-20 bg-[#0F828C]/10">
          <div className="container mx-auto px-4 md:px-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-16"
            >
              How It Works in 4 Simple Steps
            </motion.h2>

            {/* Step Timeline */}
            <div className="relative mb-12">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-full h-1 bg-gradient-to-r from-[#78B9B5]/30 to-[#0F828C]/30"></div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  number: 1,
                  title: 'Find Doctor',
                  description:
                    'Search and select from verified doctors by specialty',
                },
                {
                  number: 2,
                  title: 'Book Appointment',
                  description: 'Choose your preferred time slot instantly',
                },
                {
                  number: 3,
                  title: 'Video Consultation',
                  description: 'Join secure video call with your doctor',
                },
                {
                  number: 4,
                  title: 'Get Digital Prescriptions',
                  description: 'Receive prescription PDF in your app',
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#78B9B5] to-[#0F828C] rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      {step.title}
                    </h3>
                    <p className="text-[#B7DEE6] px-4">{step.description}</p>
                  </div>

                  {/* Step connector lines */}
                  {idx <= 3 && (
                    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-0.5 h-20 bg-gradient-to-b from-[#78B9B5]/30 to-[#0F828C]/30 hidden md:block"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctors Section - Enhanced
        <section className="py-20 bg-[#320A6B]/10">
          <div className="container mx-auto px-4 md:px-16">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-center bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-16"
            >
              Meet Our Doctors
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[...Array(8)].map((_, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="bg-[#065084]/20 backdrop-blur-sm rounded-2xl p-6 border border-[#78B9B5]/20 hover:border-[#78B9B5]/40 transition-all duration-300 text-center"
                >
                  <div className="relative mb-4">
                    <img
                      src={doctorImg}
                      alt={`Doctor ${idx + 1}`}
                      className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg border-4 border-[#78B9B5]/20"
                    />
                  </div>
                  <h3 className="font-bold text-white mb-2">Dr. John Smith</h3>
                  <p className="text-[#78B9B5] text-sm mb-3">Cardiologist</p>
                  <p className="text-[#B7DEE6] text-xs mb-4">⭐ 4.9 (127)</p>
                  <Link
                    to="/doctor-profile"
                    className="text-[#78B9B5] text-sm font-semibold hover:text-white transition-colors"
                  >
                    View Profile →
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section> */}

        {/* CTA Section */}
        <section className="py-20 bg-[#320A6B]/10">
          <div className="container mx-auto px-4 md:px-16 text-center">
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-4xl md:text-5xl font-black text-white mb-6 block">
                Ready to Start Your Journey?
              </span>
            </motion.h2>
            <p className="text-xl text-[#320A6B] mb-8 font-light">
              Join thousands of patients getting quality healthcare online
            </p>
            <Link
              to="/signup"
              className="inline-block bg-white text-[#320A6B] px-12 py-4 rounded-xl text-xl font-bold hover:bg-[#F0F8FF] transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
