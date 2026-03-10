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
import {
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Clock,
  Users,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      title: 'Real-Time Video Consultation',
      icon: videoConsultIcon,
      description:
        'Connect instantly with doctors via secure HD video calls from anywhere.',
      color: 'bg-primary-50',
      iconBg: 'bg-primary-100',
    },
    {
      title: 'Smart Appointment Booking',
      icon: bookingIcon,
      description:
        'Schedule and reschedule appointments in seconds with real-time availability.',
      color: 'bg-teal-50',
      iconBg: 'bg-teal-100',
    },
    {
      title: 'Digital Prescriptions',
      icon: prescriptionIcon,
      description:
        'Receive e-prescriptions directly to your email, instantly and securely.',
      color: 'bg-accent-50',
      iconBg: 'bg-accent-100',
    },
    {
      title: '24/7 Medical Support',
      icon: realtimeIcon,
      description:
        'Instant access to healthcare professionals around the clock, every day.',
      color: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
    },
  ];

  const stats = [
    { label: 'Active Doctors', value: '500+', icon: Users },
    { label: 'Happy Patients', value: '50K+', icon: Star },
    { label: 'Consultations Done', value: '200K+', icon: CheckCircle },
    { label: 'Cities Covered', value: '100+', icon: Shield },
  ];

  const steps = [
    {
      number: '01',
      title: 'Find a Doctor',
      description:
        'Search verified doctors by specialty, rating, and availability.',
    },
    {
      number: '02',
      title: 'Book a Slot',
      description:
        'Pick a time slot that fits your schedule in just a few clicks.',
    },
    {
      number: '03',
      title: 'Video Consultation',
      description: 'Join a secure, HD video call with your doctor.',
    },
    {
      number: '04',
      title: 'Get Prescription',
      description:
        'Receive your digital prescription and follow-up plan instantly.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative bg-mesh pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary-100/60 via-teal-50/40 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-accent-100/40 to-transparent rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />

          <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left - Content */}
              <motion.div
                className="w-full lg:w-1/2"
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                {/* Trust badge */}
                <motion.div
                  className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-8"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                  Trusted by 50,000+ patients across India
                </motion.div>

                <h1 className="font-display font-bold text-text-primary leading-tight mb-6">
                  <span className="text-4xl md:text-5xl lg:text-6xl block mb-2">
                    Healthcare,
                  </span>
                  <span className="text-4xl md:text-5xl lg:text-6xl text-gradient-primary block">
                    Reimagined
                  </span>
                  <span className="text-4xl md:text-5xl lg:text-6xl block">
                    for You
                  </span>
                </h1>

                <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-lg">
                  Connect with verified doctors through real-time video
                  consultations. Book appointments, get prescriptions, and
                  manage your health — all in one place.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link
                    to="/patient/find-doctor"
                    className="btn-primary text-base px-6 py-3 shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Find a Doctor
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-secondary text-base px-6 py-3"
                  >
                    Create Free Account
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-teal-300 border-2 border-white"
                        />
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className="fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-text-muted">
                        4.9 from 12K+ reviews
                      </p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-surface-border"></div>
                  <div className="flex items-center gap-2">
                    <Shield size={20} className="text-success" />
                    <p className="text-xs text-text-secondary font-medium">
                      HIPAA Compliant
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right - Image */}
              <motion.div
                className="w-full lg:w-1/2"
                initial={{ opacity: 0, x: 32, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              >
                <div className="relative">
                  {/* Floating card decorations */}
                  <motion.div
                    className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-card-lg p-3 flex items-center gap-3 z-10"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle size={20} className="text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        Verified Doctors
                      </p>
                      <p className="text-xs text-text-muted">
                        500+ specialists
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-card-lg p-3 flex items-center gap-3 z-10"
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1.5,
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Clock size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        Avg. Wait Time
                      </p>
                      <p className="text-xs text-success font-semibold">
                        Under 5 mins
                      </p>
                    </div>
                  </motion.div>

                  <img
                    src={bannerImg}
                    alt="Virtual Doctor Consultation"
                    className="w-full max-w-lg mx-auto rounded-3xl shadow-card-lg object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-surface-border bg-white py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <stat.icon size={20} className="text-primary-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-text-primary">
                    {stat.value}
                  </p>
                  <p className="text-sm text-text-muted mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 md:py-28 bg-surface-bg">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-4">
                Why DOCit
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary mb-4">
                Everything you need for
                <br />
                better healthcare
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto text-lg">
                A complete platform connecting patients with the right doctors
                at the right time.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`${feature.color} rounded-2xl p-7 border border-surface-border/60 cursor-default`}
                >
                  <div
                    className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-5`}
                  >
                    <img
                      src={feature.icon || serviceImg}
                      alt={feature.title}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-display font-bold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full mb-4">
                How It Works
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary mb-4">
                Get care in 4 simple steps
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto">
                From finding a doctor to receiving your prescription — all in
                minutes.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary-200 via-teal-200 to-primary-200"></div>

              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  <div className="relative z-10 w-16 h-16 bg-white border-2 border-primary-200 rounded-2xl flex flex-col items-center justify-center mx-auto mb-5 shadow-card">
                    <span className="text-xs font-bold text-primary-400 leading-none">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          ></div>
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
                Ready to transform your healthcare?
              </h2>
              <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of patients getting quality healthcare online.
                Sign up free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-8 py-3.5 rounded-xl text-base font-bold hover:bg-primary-50 transition-colors shadow-lg"
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
