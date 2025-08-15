import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center mr-6">
      <div className="bg-gradient-to-r from-[#0F828C] to-[#065084] font-extrabold text-white rounded-full w-8 h-8 flex items-center justify-center mr-2 shadow-lg">
        +
      </div>
      <span className="font-bold text-2xl bg-gradient-to-r from-[#78B9B5] to-[#0F828C] bg-clip-text text-transparent">
        DOCit
      </span>
    </Link>
  );
};

export default Logo;
