import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import Logo from './Logo';
import { MapPin, Phone, Mail, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-surface-border">
      {/* Main footer content */}
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-xs">
              Modern healthcare at your fingertips. Connect with verified
              doctors, book appointments, and manage your health — all in one
              place.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: FaFacebook, href: '#', label: 'Facebook' },
                { icon: FaTwitter, href: '#', label: 'Twitter' },
                { icon: FaInstagram, href: '#', label: 'Instagram' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl border border-surface-border flex items-center justify-center text-text-muted hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all duration-150"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Find a Doctor', href: '/patient/find-doctor' },
                { label: 'Book Appointment', href: '/patient/find-doctor' },
                { label: 'Medical History', href: '/patient/medical-history' },
                { label: 'Subscriptions', href: '/patient/subscriptions' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'For Doctors', href: '/signup' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin
                  size={15}
                  className="text-text-muted flex-shrink-0 mt-0.5"
                />
                <span className="text-sm text-text-secondary">
                  123 Healthcare Street, Medical Center, Kochi 000000
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-text-muted flex-shrink-0" />
                <a
                  href="tel:+919876543210"
                  className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
                >
                  +91 9876543210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-text-muted flex-shrink-0" />
                <a
                  href="mailto:info@docit.com"
                  className="text-sm text-text-secondary hover:text-primary-600 transition-colors"
                >
                  info@docit.com
                </a>
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-6 p-4 bg-primary-50 rounded-2xl border border-primary-100">
              <p className="text-sm font-semibold text-text-primary mb-1">
                Need help?
              </p>
              <p className="text-xs text-text-secondary mb-3">
                Our support team is available 24/7.
              </p>
              <a
                href="mailto:info@docit.com"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Contact support →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface-border">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            © {year} DOCit. All rights reserved.
          </p>
          <p className="text-xs text-text-muted flex items-center gap-1">
            Made with <Heart size={12} className="fill-error text-error" /> for
            better healthcare
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
