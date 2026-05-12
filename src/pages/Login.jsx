import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeInUp, staggerContainer } from '../utils/animations';

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left brand panel */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[45%] bg-surface-container-lowest relative overflow-hidden p-xl"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-container/10 blur-[100px] -top-40 -left-40 animate-orb-1" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-secondary-container/8 blur-[80px] bottom-0 right-0 animate-orb-2" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary-container/30">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-display text-h2 font-extrabold text-primary">Eventra</span>
        </Link>

        <div className="relative z-10 space-y-lg">
          <div>
            <h2 className="font-display text-h1 text-on-surface mb-md leading-tight">
              The platform that delivers photos{' '}
              <span className="gradient-text">before guests leave the venue.</span>
            </h2>
            <p className="text-on-surface-variant text-lg">AI face recognition. WhatsApp delivery. Camera2Cloud. Built for photographers who don't compromise.</p>
          </div>
          <div className="grid grid-cols-2 gap-md">
            {[
              { value: '~2 sec', label: 'Camera to Cloud' },
              { value: '99%+', label: 'AI Accuracy' },
              { value: 'Zero', label: 'Guest App Install' },
              { value: 'Real-Time', label: 'Live Delivery' },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="glass-card p-md rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="font-display text-h2 gradient-text">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-on-surface-variant text-sm relative z-10">© 2025 Eventra. All rights reserved.</p>
      </motion.div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-gutter">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.1, 0.3)}
        >
          {/* Mobile logo */}
          <motion.div variants={fadeInUp} className="lg:hidden mb-xl">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="font-display text-h3 text-primary">Eventra</span>
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="mb-xl">
            <h1 className="font-display text-h1 text-on-surface mb-xs">Welcome back</h1>
            <p className="text-on-surface-variant">Sign in to manage your events and galleries.</p>
          </motion.div>

          {/* Social logins */}
          <motion.div variants={fadeInUp} className="space-y-sm mb-lg">
            {[
              { icon: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg', label: 'Continue with Google', bg: 'bg-white text-gray-800 border border-gray-200' },
              { icon: null, label: 'Continue with WhatsApp', bg: 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30', wa: true },
            ].map((btn, i) => (
              <motion.button
                key={i}
                className={`w-full flex items-center justify-center gap-sm py-sm rounded-xl font-label-md text-label-md ${btn.bg} transition-all`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {btn.wa ? (
                  <span className="material-symbols-outlined text-lg">chat</span>
                ) : (
                  <img src={btn.icon} alt="Google" className="w-5 h-5" />
                )}
                {btn.label}
              </motion.button>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="flex items-center gap-md mb-lg">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="text-outline text-sm font-label-md">or continue with email</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </motion.div>

          <motion.form variants={fadeInUp} className="space-y-md" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Email address</label>
              <input
                type="email"
                placeholder="you@studio.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-xs">
                <label className="text-on-surface-variant text-sm font-label-md">Password</label>
                <span className="text-primary text-sm font-label-md cursor-pointer hover:underline">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm pr-12 text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  <span className="material-symbols-outlined text-sm">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <motion.button
              type="submit"
              className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md text-label-md shadow-lg shadow-primary-container/25"
              whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(124,58,237,0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
          </motion.form>

          <motion.p variants={fadeInUp} className="text-center text-on-surface-variant mt-lg text-sm">
            Don't have an account?{' '}
            <Link to="/businesssignup" className="text-primary font-label-md hover:underline">
              Get early access →
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
