import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Features', href: '/featuresoverview' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/aboutus' },
  { label: 'Contact', href: '/contactbookdemo' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <nav
        className={`w-full max-w-[1280px] rounded-2xl flex justify-between items-center px-6 py-3 transition-all duration-300 ${
          scrolled
            ? 'bg-surface-container/90 backdrop-blur-xl border border-white/8 shadow-2xl shadow-black/30'
            : 'bg-surface-container/40 backdrop-blur-md border border-white/5'
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center shadow-lg shadow-primary-container/40 group-hover:shadow-primary-container/60 transition-shadow">
            <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-display text-h3 font-extrabold text-primary">Eventra</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link key={link.href} to={link.href} className="relative group">
                <span className={`font-label-md text-label-md transition-colors duration-200 ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    layoutId="nav-underline"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:block">
            <span className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors duration-200">
              Log in
            </span>
          </Link>
          <Link to="/businesssignup">
            <motion.button
              className="bg-primary-container text-on-primary-container px-5 py-2 rounded-xl font-label-md text-label-md shadow-lg shadow-primary-container/25"
              whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              Get Started
            </motion.button>
          </Link>

          {/* Mobile hamburger */}
          <motion.button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-surface-variant text-on-surface-variant"
            onClick={() => setMenuOpen(!menuOpen)}
            whileTap={{ scale: 0.92 }}
          >
            <span className="material-symbols-outlined text-lg">{menuOpen ? 'close' : 'menu'}</span>
          </motion.button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="absolute top-[80px] left-4 right-4 bg-surface-container/95 backdrop-blur-xl border border-white/8 rounded-2xl p-4 shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-3 rounded-xl font-label-md text-label-md transition-colors ${
                    location.pathname === link.href
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-outline-variant/20 mt-2 pt-2 flex flex-col gap-1">
                <Link to="/login" className="px-4 py-3 rounded-xl font-label-md text-on-surface-variant hover:bg-surface-variant transition-colors">
                  Log in
                </Link>
                <Link to="/businesssignup" className="px-4 py-3 rounded-xl font-label-md bg-primary-container text-on-primary-container text-center">
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
