import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeInUp, staggerContainer } from '../utils/animations';

const roles = [
  { id: 'photographer', icon: 'camera_alt', label: 'Photographer', desc: 'Wedding, event & portrait photographers' },
  { id: 'planner', icon: 'event', label: 'Event Planner', desc: 'Wedding & corporate event companies' },
  { id: 'enterprise', icon: 'business', label: 'Organisation', desc: 'Hotels, colleges & enterprise teams' },
  { id: 'individual', icon: 'person', label: 'Individual Host', desc: 'Personal events up to 500 guests' },
];

const steps = ['Choose Role', 'Account Details', 'Complete Setup'];

export default function BusinessSignup() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', password: '' });
  const [done, setDone] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left brand panel */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[38%] bg-surface-container-lowest p-xl relative overflow-hidden"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-container/10 blur-[120px] -top-40 -left-40 animate-orb-1" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-primary-container rounded-xl flex items-center justify-center shadow-lg shadow-primary-container/30">
            <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-display text-h2 font-extrabold text-primary">Eventra</span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-h2 text-on-surface mb-lg leading-tight">
            Join the next generation of event professionals delivering <span className="gradient-text">AI-powered</span> photo experiences.
          </h2>
          <div className="space-y-sm">
            {[
              'AI face recognition included in all plans',
              'Camera2Cloud real-time upload',
              'WhatsApp delivery — zero app for guests',
              '14-day free trial, no credit card',
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-sm"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-on-surface-variant text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-md rounded-xl relative z-10">
          <p className="text-on-surface text-sm italic mb-sm">"Guests were receiving photos while I was still shooting. It feels like actual magic."</p>
          <div className="flex items-center gap-sm">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-xs font-bold text-on-primary-container">P</div>
            <div className="text-xs text-on-surface-variant">Priya S. — Wedding Photographer</div>
          </div>
        </div>
      </motion.div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-gutter overflow-y-auto">
        <div className="w-full max-w-lg py-lg">
          {/* Mobile logo */}
          <div className="lg:hidden mb-lg">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="font-display text-h3 text-primary">Eventra</span>
            </Link>
          </div>

          {/* Step indicator */}
          {!done && (
            <div className="flex items-center gap-sm mb-xl">
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'bg-primary-container text-on-primary-container shadow-md shadow-primary-container/30' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {i < step ? <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : i + 1}
                    </div>
                    <span className={`text-xs font-label-md hidden sm:block ${i === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-px transition-all ${i < step ? 'bg-primary-container' : 'bg-outline-variant/30'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" className="text-center py-xl" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  className="w-24 h-24 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-lg border border-secondary-container/30"
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>celebration</span>
                </motion.div>
                <h2 className="font-display text-h2 text-on-surface mb-sm">Welcome to Eventra!</h2>
                <p className="text-on-surface-variant mb-lg">Your account is ready. Your first event is 30 seconds away. Welcome to the future of event photography.</p>
                <Link to="/dashboard">
                  <motion.button className="bg-primary-container text-on-primary-container px-xl py-md rounded-xl font-label-md shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    Create Your First Event →
                  </motion.button>
                </Link>
              </motion.div>
            ) : step === 0 ? (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="font-display text-h1 text-on-surface mb-xs">What best describes you?</h1>
                <p className="text-on-surface-variant mb-xl">We'll tailor your experience based on how you use Eventra.</p>
                <div className="grid grid-cols-2 gap-md mb-xl">
                  {roles.map((r) => (
                    <motion.div
                      key={r.id}
                      className={`glass-card p-md rounded-2xl cursor-pointer border-2 transition-all ${role === r.id ? 'border-primary-container glow-border' : 'border-transparent hover:border-outline-variant/40'}`}
                      onClick={() => setRole(r.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-sm ${role === r.id ? 'bg-primary-container' : 'bg-surface-variant'}`}>
                        <span className={`material-symbols-outlined ${role === r.id ? 'text-on-primary-container' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{r.icon}</span>
                      </div>
                      <div className={`font-display text-base mb-xs ${role === r.id ? 'text-primary' : 'text-on-surface'}`}>{r.label}</div>
                      <div className="text-on-surface-variant text-xs">{r.desc}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  onClick={() => role && setStep(1)}
                  className={`w-full py-sm rounded-xl font-label-md text-label-md transition-all ${role ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/25' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}
                  whileHover={role ? { scale: 1.02 } : {}}
                  whileTap={role ? { scale: 0.98 } : {}}
                >
                  Continue →
                </motion.button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="font-display text-h1 text-on-surface mb-xs">Create your account</h1>
                <p className="text-on-surface-variant mb-xl">Your login credentials for Eventra.</p>
                <div className="space-y-md mb-xl">
                  {[
                    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
                    { name: 'business', label: 'Studio / Business Name', type: 'text', placeholder: 'Your studio name' },
                    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@studio.com' },
                    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
                    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">{f.label}</label>
                      <input
                        name={f.name}
                        type={f.type}
                        placeholder={f.placeholder}
                        value={form[f.name]}
                        onChange={handle}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-sm">
                  <motion.button
                    className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25"
                    onClick={() => setStep(2)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    Continue →
                  </motion.button>
                  <button className="w-full py-sm rounded-xl font-label-md glass-card border border-outline-variant/20 text-on-surface">
                    Sign up with Google
                  </button>
                </div>
                <button className="text-on-surface-variant text-sm mt-md block mx-auto" onClick={() => setStep(0)}>← Back</button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <h1 className="font-display text-h1 text-on-surface mb-xs">Almost there!</h1>
                <p className="text-on-surface-variant mb-xl">Choose a plan to get started. Upgrade or cancel anytime.</p>
                <div className="space-y-sm mb-xl">
                  {[
                    { name: 'Free', desc: 'Up to 40 guests · 1 event', price: '₹0', highlight: false },
                    { name: 'Starter', desc: '100 GB · All AI features', price: '₹999/mo', highlight: false },
                    { name: 'Professional', desc: '1 TB · Everything included', price: '₹3,999/mo', highlight: true },
                  ].map((plan) => (
                    <motion.div
                      key={plan.name}
                      className={`glass-card p-md rounded-xl flex items-center justify-between cursor-pointer border ${plan.highlight ? 'border-primary-container' : 'border-outline-variant/20 hover:border-outline-variant/40'} transition-all`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div>
                        <div className={`font-display text-base ${plan.highlight ? 'text-primary' : 'text-on-surface'}`}>{plan.name}</div>
                        <div className="text-on-surface-variant text-xs">{plan.desc}</div>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span className="font-label-md text-sm text-on-surface">{plan.price}</span>
                        {plan.highlight && <span className="bg-primary-container text-on-primary-container text-xs px-sm py-xs rounded-full font-label-md">Popular</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25 mb-sm"
                  onClick={() => setDone(true)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  Complete Setup
                </motion.button>
                <button className="text-on-surface-variant text-sm block mx-auto" onClick={() => setStep(1)}>← Back</button>
              </motion.div>
            )}
          </AnimatePresence>

          {!done && (
            <p className="text-center text-on-surface-variant text-sm mt-lg">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-label-md hover:underline">Sign in →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
