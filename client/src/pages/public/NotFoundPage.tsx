import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#320A6B] via-[#065084] to-[#0F828C] flex items-center justify-center p-4">
      <motion.div
        className="bg-[#0F828C]/10 backdrop-blur-lg rounded-2xl border border-[#78B9B5]/20 p-8 text-center shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-6xl font-bold bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent mb-4"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.h1>

        <motion.h2
          className="text-2xl font-semibold mb-4 bg-gradient-to-r from-[#78B9B5] to-[#320A6B] bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Page Not Found
        </motion.h2>
        <motion.p
          className="text-[#78B9B5] mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Oops! It looks like you're lost. The page you're looking for doesn't
          exist or has been moved.
        </motion.p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-[#0F828C] to-[#78B9B5] text-white px-6 py-3 rounded-lg hover:from-[#065084] hover:to-[#320A6B] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Go Back Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
