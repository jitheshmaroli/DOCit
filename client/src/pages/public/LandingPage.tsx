import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import bannerImg from '../../assets/hero-illustration.jpeg';
import serviceImg from '../../assets/service1.jpeg';
import doctorImg from '../../assets/doctor1.jpeg';

const LandingPage: React.FC = () => {
  const serviceData = [
    {
      title: 'Online Booking',
      icon: serviceImg,
      description: 'Book appointments effortlessly online.',
    },
    {
      title: 'Doctor Consultation',
      icon: serviceImg,
      description: 'Connect with doctors virtually.',
    },
    {
      title: 'Prescription',
      icon: serviceImg,
      description: 'Get prescriptions digitally.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#320A6B] via-[#065084] to-[#0F828C] text-[#B7DEE6]">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-16">
            <div className="flex flex-col lg:flex-row items-center">
              <motion.div
                className="w-full lg:w-1/2 mb-10 lg:mb-0 lg:pr-8 z-10"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-4 md:mb-6">
                  Find Your Doctor, Book Appointments Online
                </h1>
                <p className="text-lg md:text-xl text-[#78B9B5] mb-6 md:mb-8">
                  We help people get appointments online easily and quickly.
                </p>
                <Link
                  to="/patient/find-doctor"
                  className="inline-block bg-gradient-to-r from-[#0F828C] to-[#065084] text-white px-6 py-3 rounded-lg text-base md:text-lg hover:from-[#065084] hover:to-[#320A6B] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Find Your Doctor
                </Link>
              </motion.div>

              <motion.div
                className="w-full lg:w-1/2 flex justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <motion.img
                  src={bannerImg}
                  alt="Doctor Appointment Booking"
                  className="max-w-full h-auto max-h-80 md:max-h-96 lg:max-h-[500px] rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05 }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Easy Online Appointment Section */}
        <section className="py-16 bg-[#0F828C]/10 backdrop-blur-lg">
          <div className="container mx-auto px-4 md:px-16">
            <div className="flex flex-col md:flex-row items-center">
              <motion.div
                className="md:w-1/2 mb-8 md:mb-0"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <img
                  src={bannerImg}
                  alt="Online Doctor Consultation"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                />
              </motion.div>

              <motion.div
                className="md:w-1/2 md:pl-12"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#320A6B] to-[#065084] bg-clip-text text-transparent mb-4">
                  Easy Online Appointment
                </h3>
                <p className="text-[#78B9B5] mb-6">
                  We provide a simple and efficient way to connect patients with
                  healthcare providers. Book appointments online, receive
                  reminders, and manage your health records all in one place.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="py-16 bg-[#320A6B]/10 backdrop-blur-lg">
          <div className="container mx-auto px-4 md:px-16">
            <div className="flex flex-col md:flex-row items-center">
              <motion.div
                className="md:w-1/2 md:pr-12"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0F828C] to-[#78B9B5] bg-clip-text text-transparent mb-4">
                  Who We Are
                </h3>
                <p className="text-[#78B9B5] mb-6">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <p className="text-[#78B9B5] mb-6">
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa
                  qui officia deserunt mollit anim id est laborum.
                </p>
              </motion.div>

              <motion.div
                className="md:w-1/2 mb-8 md:mb-0"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <img
                  src={bannerImg}
                  alt="Who We Are"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section
          id="services"
          className="py-16 bg-[#0F828C]/10 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 md:px-16">
            <motion.h2
              initial={{ opacity: 0, y: -22 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-8 md:mb-12"
            >
              Our Services
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {serviceData.map((service, idx) => (
                <motion.div
                  key={idx}
                  className="bg-[#065084]/20 p-6 rounded-lg shadow-lg text-center border border-[#78B9B5]/20"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  viewport={{ once: true }}
                >
                  <img
                    src={service.icon}
                    alt={service.title}
                    className="mx-auto mb-4 h-20 rounded-full object-cover"
                  />
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#78B9B5] mt-2">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctors Section */}
        <section
          id="doctors"
          className="py-16 bg-[#320A6B]/10 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 md:px-16">
            <motion.h2
              initial={{ opacity: 0, y: -22 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-8 md:mb-12"
            >
              Our Doctors
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.18 },
                },
              }}
            >
              {[...Array(4)].map((_, idx) => (
                <motion.div
                  key={idx}
                  className="bg-[#065084]/20 border border-[#78B9B5]/20 rounded-lg p-4 text-center"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.18 }}
                  whileHover={{ scale: 1.06 }}
                >
                  <img
                    src={doctorImg}
                    alt={`Doctor ${idx + 1}`}
                    className="rounded-full mx-auto mb-4 w-28 h-28 object-cover shadow-md"
                  />
                  <h3 className="font-semibold bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent">
                    Dr. Name
                  </h3>
                  <p className="text-sm text-[#78B9B5]">Specialization</p>
                  <button className="mt-3 text-sm text-[#320A6B] hover:text-[#065084] transition-colors">
                    View Profile
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
