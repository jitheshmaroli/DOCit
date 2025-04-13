import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import bannerImg from '../../assets/hero-illustration.jpeg';
import serviceImg from '../../assets/service1.jpeg';
import doctorImg from '../../assets/doctor1.jpeg';

const LandingPage: React.FC = () => {
   const serviceData = [
    { title: 'Online Booking', icon: serviceImg, description: 'Book appointments effortlessly online.' },
    { title: 'Doctor Consultation', icon: serviceImg, description: 'Connect with doctors virtually.' },
    { title: 'Prescription', icon: serviceImg, description: 'Get prescriptions digitally.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900 text-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-16">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="w-full lg:w-1/2 mb-10 lg:mb-0 lg:pr-8 z-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-4 md:mb-6">
                  Find Your Doctor, Book Appointments Online
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-6 md:mb-8">
                  We help people get appointments online easily and quickly.
                </p>
                <Link
                  to="/patient/find-doctor"
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg text-base md:text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Find Your Doctor
                </Link>
              </div>
              <div className="w-full lg:w-1/2 flex justify-center">
                <img
                  src={bannerImg}
                  alt="Doctor Appointment Booking"
                  className="max-w-full h-auto max-h-80 md:max-h-96 lg:max-h-[500px] rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white/10 backdrop-blur-lg">
          <div className="container mx-auto px-4 md:px-16">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <img
                  src={bannerImg}
                  alt="Online Doctor Consultation"
                  className="max-w-full h-auto rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="md:w-1/2 md:pl-12">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Easy Online Appointment
                </h3>
                <p className="text-gray-200 mb-6">
                  We provide a simple and efficient way to connect patients with healthcare providers. Book appointments online, receive reminders, and manage your health records all in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="py-16 bg-white/10 backdrop-blur-lg">
          <div className="container mx-auto px-4 md:px-16">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 md:pr-12">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Who We Are</h3>
                <p className="text-gray-200 mb-6">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="text-gray-200 mb-6">
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
                </p>
              </div>
              <div className="md:w-1/2 mb-8 md:mb-0">
                <img
                  src={bannerImg}
                  alt="Who We Are"
                  className="max-w-full h-auto rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 bg-white/10 backdrop-blur-lg">
          <div className="container mx-auto px-4 md:px-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-8 md:mb-12">
              Our Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {serviceData.map((service, index) => (
                <div
                  key={index}
                  className="bg-white/20 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-white/20"
                >
                  <img
                    src={service.icon}
                    alt={service.title}
                    className="mx-auto mb-4 h-20 rounded-full object-cover"
                  />
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="text-sm text-gray-200 mt-2">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctors Section */}
        <section id="doctors" className="py-16 bg-white/10 backdrop-blur-lg">
          <div className="container mx-auto px-4 md:px-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-8 md:mb-12">
              Our Doctors
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white/20 border border-white/20 rounded-lg p-4 text-center hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={doctorImg}
                    alt={`Doctor ${index + 1}`}
                    className="rounded-full mx-auto mb-4 w-28 h-28 object-cover shadow-md"
                  />
                  <h3 className="font-semibold text-white">Dr. Name</h3>
                  <p className="text-sm text-gray-200">Specialization</p>
                  <button className="mt-3 text-sm text-purple-300 hover:text-purple-200 transition-colors">
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;