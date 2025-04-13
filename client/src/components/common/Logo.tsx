import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center mr-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 font-extrabold text-white rounded-full w-8 h-8 flex items-center justify-center mr-2 shadow-lg">
        +
      </div>
      <span className="font-bold text-2xl bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
        DOCit
      </span>
    </Link>
  );
};

export default Logo;