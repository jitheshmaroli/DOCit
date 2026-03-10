import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
      <motion.div
        className="card max-w-md w-full p-10 text-center"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Icon */}
        <motion.div
          className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <AlertCircle size={36} className="text-primary-400" />
        </motion.div>

        {/* 404 */}
        <motion.h1
          className="text-7xl font-display font-extrabold text-gradient-primary mb-3"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          404
        </motion.h1>

        <motion.h2
          className="text-xl font-bold text-text-primary mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          Page Not Found
        </motion.h2>

        <motion.p
          className="text-sm text-text-secondary mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          Oops! It looks like you're lost. The page you're looking for doesn't
          exist or has been moved.
        </motion.p>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link to="/" className="btn-primary inline-flex">
            <Home size={16} /> Go Back Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
