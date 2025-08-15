import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-[#320A6B] to-[#065084] text-[#78B9B5] py-12">
      <div className="container mx-auto px-4 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-[#0F828C] to-[#78B9B5] bg-clip-text text-transparent">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-[#78B9B5] hover:text-[#0F828C] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-[#78B9B5] hover:text-[#0F828C] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[#78B9B5] hover:text-[#0F828C] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-[#0F828C] to-[#78B9B5] bg-clip-text text-transparent">
              Contact Info
            </h3>
            <p className="mb-2 text-[#B7DEE6]">123 Healthcare Street</p>
            <p className="mb-2 text-[#B7DEE6]">Medical Center, NY 10001</p>
            <p className="mb-2 text-[#B7DEE6]">Phone: +1 (555) 123-4567</p>
            <p className="text-[#B7DEE6]">Email: info@docit.com</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-[#0F828C] to-[#78B9B5] bg-clip-text text-transparent">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-[#78B9B5] hover:text-[#0F828C] transition-colors"
              >
                <FaFacebook size={24} />
              </a>
              <a
                href="#"
                className="text-[#78B9B5] hover:text-[#0F828C] transition-colors"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href="#"
                className="text-[#78B9B5] hover:text-[#0F828C] transition-colors"
              >
                <FaInstagram size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-[#78B9B5]/20 mt-8 pt-8 text-center">
          <p className="text-[#B7DEE6]">
            © {new Date().getFullYear()} DOCIT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
