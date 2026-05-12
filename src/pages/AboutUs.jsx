import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fadeInUp, staggerContainer, slideInLeft, slideInRight, viewport } from '../utils/animations';

const capabilities = [
  { value: '~2 sec', label: 'Camera to Cloud', icon: 'bolt' },
  { value: '99%+', label: 'AI Match Accuracy', icon: 'face_6' },
  { value: 'Zero', label: 'Guest App Installs', icon: 'phone_iphone' },
  { value: '50K+', label: 'Guests per Event (capacity)', icon: 'group' },
];

const timeline = [
  { year: '2022', title: 'The Problem', desc: 'Co-founders identify the chaos of manual photo distribution at large events — weeks of waiting, wrong photos, guests left empty-handed.' },
  { year: 'Early 2023', title: 'Building the AI Pipeline', desc: 'Developed the core AI facial recognition engine from scratch, optimised specifically for event photography — crowds, angles, low light.' },
  { year: 'Apr 2023', title: 'First Real-World Test', desc: 'Beta-tested Camera2Cloud at APOGEE, the tech fest of BITS Pilani — 10,000+ attendees and a proof of concept that held at scale.' },
  { year: '2024', title: 'WhatsApp-Native Delivery', desc: 'Shipped the full WhatsApp bot — RSVP, selfie collection, AI matching, photo delivery — all inside WhatsApp, zero app required.' },
  { year: '2025', title: 'Eventra Launches', desc: 'The complete end-to-end platform launches publicly. From camera shutter to guest WhatsApp — the entire pipeline, one product.' },
];

const values = [
  { icon: 'lock', title: 'Privacy First', desc: 'Guests own their images. Every feature is designed with data minimisation and consent at its core. GDPR-mindful architecture from day one.' },
  { icon: 'bolt', title: 'Zero Friction', desc: "If guests need a new app, we've failed. WhatsApp delivery removes every barrier between an event and its memories." },
  { icon: 'storefront', title: 'Creator Empowerment', desc: 'We help photographers grow their business, not just deliver files. Every feature creates new efficiency and new revenue opportunities.' },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <section className="relative pt-36 pb-xl px-gutter hero-glow grid-bg overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-primary-container/10 blur-[120px] animate-orb-1" style={{ top: '-20%', left: '-10%' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-secondary-container/8 blur-[100px] animate-orb-2" style={{ bottom: '-10%', right: '-5%' }} />
        </div>
        <div className="max-w-[1280px] mx-auto text-center relative z-10">
          <motion.div variants={staggerContainer(0.12)} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/15 border border-primary-container/25 rounded-full text-primary font-label-md text-sm mb-lg">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                Our Story
              </span>
            </motion.div>
            <motion.h1 className="font-display text-h1 md:text-display text-on-surface mb-md" variants={fadeInUp}>
              We built this because event memories <span className="gradient-text">deserve better</span>
            </motion.h1>
            <motion.p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto" variants={fadeInUp}>
              Eventra — built to solve one real problem: photos from events that reach guests too late, in the wrong hands, or never at all. We fix the entire pipeline.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Platform capabilities */}
      <section className="py-lg border-y border-outline-variant/10 bg-surface-container-lowest">
        <div className="max-w-[1280px] mx-auto px-gutter">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.1)} initial="hidden" whileInView="visible" viewport={viewport}>
            {capabilities.map((s, i) => (
              <motion.div key={i} className="text-center p-md glass-card rounded-2xl" variants={fadeInUp}>
                <span className="material-symbols-outlined text-primary text-h2 mb-xs block" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h1 gradient-text">{s.value}</div>
                <div className="text-on-surface-variant font-label-md text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-xl px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-xl">
            <motion.div className="flex-1" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft}>
              <span className="text-secondary font-label-md text-sm uppercase tracking-widest">The Origin</span>
              <h2 className="font-display text-h2 text-on-surface mt-sm mb-md">Born at a 10,000-Person College Fest</h2>
              <p className="text-on-surface-variant text-lg mb-md leading-relaxed">Eventra was born from a simple frustration: at large events, thousands of guests want their photos — and the distribution is always a mess of WhatsApp groups, missing tags, and week-long waits.</p>
              <p className="text-on-surface-variant text-lg mb-md leading-relaxed">One co-founder ran an event company and lived this problem firsthand. The other was a technologist who knew it was solvable with AI. They proved the concept at APOGEE — the annual tech fest of BITS Pilani — handling 10,000+ attendees at scale.</p>
              <p className="text-on-surface-variant text-lg leading-relaxed">The name <em>Eventra</em> is deliberate. Events + Ultra. A platform built to make every aspect of event media distribution faster, smarter, and more personal than anything that came before.</p>
            </motion.div>
            <motion.div className="flex-1" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInRight}>
              <div className="glass-card p-lg rounded-3xl space-y-md">
                <div className="text-5xl font-display text-primary opacity-20 leading-none">"</div>
                <p className="text-on-surface text-xl italic leading-relaxed font-display">We didn't set out to build a SaaS company. We set out to fix one broken experience that millions of people go through every week.</p>
                <div className="flex items-center gap-sm pt-sm border-t border-outline-variant/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-xs font-bold text-on-primary-container">SK</div>
                  <div>
                    <div className="font-bold text-on-surface text-sm">Co-Founder, Eventra</div>
                    <div className="text-on-surface-variant text-xs">Previously: KnotsbyAMP</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-xl bg-surface-container-low px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="font-display text-h2 text-on-surface">Our Journey</h2>
          </motion.div>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary-container via-secondary-container to-transparent" />
            <div className="space-y-lg pl-16">
              {timeline.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }} className="relative">
                  <div className="absolute -left-12 w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shadow-lg shadow-primary-container/40 z-10">
                    <span className="material-symbols-outlined text-on-primary-container text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <div className="glass-card p-md rounded-2xl">
                    <div className="text-primary font-label-md text-sm mb-xs">{item.year}</div>
                    <h3 className="font-display text-h3 text-on-surface mb-xs">{item.title}</h3>
                    <p className="text-on-surface-variant text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="font-display text-h2 text-on-surface">What We Stand For</h2>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-md" variants={staggerContainer(0.12)} initial="hidden" whileInView="visible" viewport={viewport}>
            {values.map((v, i) => (
              <motion.div key={i} className="glass-card p-lg rounded-2xl text-center group" variants={fadeInUp} whileHover={{ y: -6, transition: { duration: 0.25 } }}>
                <div className="w-16 h-16 bg-primary-container/15 rounded-2xl flex items-center justify-center mb-md mx-auto group-hover:bg-primary-container/30 transition-colors">
                  <span className="material-symbols-outlined text-primary text-h2" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span>
                </div>
                <h3 className="font-display text-h3 text-on-surface mb-sm">{v.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-xl bg-surface-container-lowest px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="font-display text-h2 text-on-surface mb-sm">The Team</h2>
            <p className="text-on-surface-variant">A small, focused team obsessed with the problem.</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-3xl mx-auto mb-xl" variants={staggerContainer(0.1)} initial="hidden" whileInView="visible" viewport={viewport}>
            {[
              { initials: 'SK', name: 'Siddharth K.', role: 'Co-Founder & CEO', bg: 'Event Industry · BITS Pilani', desc: 'Previously ran KnotsbyAMP, a premium wedding planning company. Deep domain expertise in large-scale Indian social events and what makes photo distribution actually work for guests.' },
              { initials: 'AT', name: 'Arjun T.', role: 'Co-Founder & CTO', bg: 'ML / Systems · BITS Pilani', desc: 'Computer Science & ML background from BITS Pilani. Built the AI facial recognition pipeline and Camera2Cloud infrastructure from scratch — optimised for real-world event conditions.' },
            ].map((p, i) => (
              <motion.div key={i} className="glass-card p-lg rounded-2xl" variants={fadeInUp} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                <div className="flex items-start gap-md">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-on-primary-container font-display text-h3 flex-shrink-0 shadow-lg">{p.initials}</div>
                  <div>
                    <h3 className="font-display text-h3 text-on-surface">{p.name}</h3>
                    <div className="text-primary font-label-md text-sm">{p.role}</div>
                    <div className="text-on-surface-variant text-xs mb-sm">{p.bg}</div>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="text-center" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <div className="glass-card inline-flex items-center gap-md px-lg py-md rounded-2xl">
              <span className="material-symbols-outlined text-secondary text-h2">rocket_launch</span>
              <div className="text-left">
                <div className="font-display text-h3 text-on-surface">We're hiring</div>
                <div className="text-on-surface-variant text-sm">ML Engineers · Frontend · Growth</div>
              </div>
              <motion.button className="bg-primary-container text-on-primary-container px-md py-xs rounded-lg font-label-md text-sm ml-md" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>View Openings</motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-xl px-gutter">
        <div className="max-w-[1280px] mx-auto text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="font-display text-h2 text-on-surface mb-md">Ready to be part of the story?</h2>
            <div className="flex flex-col sm:flex-row gap-md justify-center">
              <Link to="/businesssignup"><motion.button className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Get Early Access</motion.button></Link>
              <Link to="/contactbookdemo"><motion.button className="glass-card text-on-surface px-lg py-sm rounded-xl font-label-md border border-outline-variant/20" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Book a Demo</motion.button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
