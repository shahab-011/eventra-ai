import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeInUp, staggerContainer, viewport } from '../utils/animations';

const links = {
  Product: [
    { label: 'Features', href: '/featuresoverview' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'AI Face Recognition', href: '/aifacerecognitionhub' },
    { label: 'Camera2Cloud', href: '/camera2cloudsetup' },
    { label: 'WhatsApp Bot', href: '/whatsappbotconfig' },
  ],
  Company: [
    { label: 'About Us', href: '/aboutus' },
    { label: 'Contact', href: '/contactbookdemo' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Data Processing', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/10 pt-xl pb-lg">
      <div className="max-w-[1280px] mx-auto px-gutter">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-5 gap-xl mb-xl"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {/* Brand column */}
          <motion.div className="md:col-span-2" variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-md">
              <div className="w-9 h-9 bg-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary-container/30">
                <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="font-display text-h2 font-extrabold text-primary">Eventra</span>
            </div>
            <p className="text-on-surface-variant font-body-md text-body-md leading-relaxed max-w-xs mb-lg">
              The world's first full-stack AI event photo sharing platform. Built for photographers who don't compromise.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: 'language', label: 'Website' },
                { icon: 'alternate_email', label: 'Email' },
                { icon: 'chat_bubble', label: 'Chat' },
              ].map((s) => (
                <motion.button
                  key={s.icon}
                  className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.93 }}
                  aria-label={s.label}
                >
                  <span className="material-symbols-outlined text-sm">{s.icon}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <motion.div key={title} variants={fadeInUp}>
              <h4 className="font-display text-h3 text-on-surface mb-md">{title}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="border-t border-outline-variant/10 pt-lg flex flex-col md:flex-row justify-between items-center gap-md"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <p className="text-on-surface-variant text-sm">© 2025 Eventra AI. All rights reserved.</p>
          <div className="flex items-center gap-md text-on-surface-variant text-sm">
            <span className="gradient-text font-label-md">World's first full-stack AI photo sharing platform</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
            <span className="text-on-surface-variant text-sm">All systems operational</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
