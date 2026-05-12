import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fadeInUp, staggerContainer, slideInLeft, slideInRight, viewport } from '../utils/animations';

const demoPoints = [
  { icon: 'face_6', text: 'Live AI face recognition on a real event gallery' },
  { icon: 'cloud_sync', text: 'Camera2Cloud real-time upload walkthrough' },
  { icon: 'chat', text: 'WhatsApp bot demo — from selfie to photo delivery' },
  { icon: 'palette', text: 'White-label gallery setup in under 5 minutes' },
];

const testimonials = [
  { name: 'Priya S.', role: 'Wedding Photographer', quote: 'Booked a demo on a Tuesday. Had my first event running by Friday.' },
  { name: 'Marcus T.', role: 'Event Agency Director', quote: 'The sales team understood our scale requirements immediately. No fluff.' },
  { name: 'Ananya R.', role: 'Corporate Events Lead', quote: 'Best 30-minute investment. Saw the whole platform live before committing.' },
];

export default function ContactBookDemo() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', eventType: '', teamSize: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => { e.preventDefault(); setSubmitted(true); };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <section className="pt-32 pb-xl px-gutter hero-glow">
        <div className="max-w-[1280px] mx-auto">
          <motion.div className="text-center mb-xl" variants={staggerContainer(0.1)} initial="hidden" animate="visible">
            <motion.h1 className="font-display text-h1 md:text-display text-on-surface mb-md" variants={fadeInUp}>
              See Eventra in <span className="gradient-text">Action</span>
            </motion.h1>
            <motion.p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto" variants={fadeInUp}>
              Book a live demo or drop us a message. We respond within 2 hours on business days.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-xl">
            {/* Left panel */}
            <motion.div className="lg:col-span-2 space-y-lg" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft}>
              <div className="glass-card p-lg rounded-2xl">
                <h2 className="font-display text-h2 text-on-surface mb-md">What you'll see</h2>
                <div className="space-y-md">
                  {demoPoints.map((p, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-md"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="w-10 h-10 bg-primary-container/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                      </div>
                      <span className="text-on-surface text-sm">{p.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-lg rounded-2xl">
                <div className="flex items-center gap-sm mb-md">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  <span className="text-on-surface-variant text-sm font-label-md">Average response time: under 2 hours</span>
                </div>
                <div className="space-y-sm">
                  {testimonials.map((t, i) => (
                    <div key={i} className="p-sm bg-surface-container rounded-xl">
                      <p className="text-on-surface-variant text-xs italic mb-xs">"{t.quote}"</p>
                      <div className="flex items-center gap-xs">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-xs text-on-primary-container font-bold">{t.name[0]}</div>
                        <span className="text-on-surface text-xs font-bold">{t.name}</span>
                        <span className="text-on-surface-variant text-xs">· {t.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Other ways to reach us</h3>
                <div className="space-y-sm">
                  {[
                    { icon: 'mail', label: 'Sales', value: 'sales@Eventra.ai' },
                    { icon: 'support_agent', label: 'Support', value: 'support@Eventra.ai' },
                    { icon: 'chat', label: 'WhatsApp', value: '+91 98765 43210' },
                    { icon: 'location_on', label: 'Office', value: 'Mumbai, India' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-sm">{item.icon}</span>
                      <span className="text-on-surface-variant text-sm"><strong className="text-on-surface">{item.label}:</strong> {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div className="lg:col-span-3" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInRight}>
              <div className="glass-card p-lg rounded-2xl">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      className="text-center py-xl"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="w-20 h-20 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-lg"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <span className="material-symbols-outlined text-secondary text-h1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </motion.div>
                      <h2 className="font-display text-h2 text-on-surface mb-sm">We'll be in touch!</h2>
                      <p className="text-on-surface-variant">Expect a response within 2 hours during business hours. We'll send a calendar invite to {form.email}.</p>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={submit} className="space-y-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div>
                        <h2 className="font-display text-h2 text-on-surface mb-sm">Book a Demo</h2>
                        <p className="text-on-surface-variant text-sm">Fill this in and we'll schedule a 30-minute live session.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                        {[
                          { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name', required: true },
                          { name: 'email', label: 'Work Email', type: 'email', placeholder: 'you@studio.com', required: true },
                          { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210', required: false },
                          { name: 'company', label: 'Studio / Company', type: 'text', placeholder: 'Your studio name', required: false },
                        ].map((field) => (
                          <div key={field.name}>
                            <label className="block text-on-surface-variant text-sm font-label-md mb-xs">{field.label}{field.required && <span className="text-primary ml-1">*</span>}</label>
                            <input
                              name={field.name}
                              type={field.type}
                              placeholder={field.placeholder}
                              required={field.required}
                              value={form[field.name]}
                              onChange={handle}
                              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                        <div>
                          <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Event Type</label>
                          <select name="eventType" value={form.eventType} onChange={handle} className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface focus:border-primary outline-none text-sm">
                            <option value="">Select type</option>
                            {['Wedding', 'Corporate', 'College / Fest', 'Birthday / Social', 'Conference', 'Other'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Team Size</label>
                          <select name="teamSize" value={form.teamSize} onChange={handle} className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface focus:border-primary outline-none text-sm">
                            <option value="">Select size</option>
                            {['Just me', '2–5', '6–20', '20+'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Message (optional)</label>
                        <textarea
                          name="message"
                          rows={4}
                          placeholder="Tell us about your use case, event volume, or any specific questions..."
                          value={form.message}
                          onChange={handle}
                          className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-colors text-sm"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md text-label-md shadow-lg shadow-primary-container/25 flex items-center justify-center gap-sm"
                        whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(124,58,237,0.4)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Book My Demo
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </motion.button>
                      <p className="text-outline text-xs text-center">Your data is secure. No spam, ever. Read our <span className="text-primary cursor-pointer">Privacy Policy</span>.</p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
