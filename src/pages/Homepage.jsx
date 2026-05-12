import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fadeInUp, staggerContainer, viewport } from '../utils/animations';

const features = [
  { icon: 'face_6', title: 'AI Facial Recognition', desc: 'Match faces across thousands of photos in seconds. Works in crowds, group shots, low light — powered by production-grade AI.' },
  { icon: 'chat', title: 'WhatsApp-Native Delivery', desc: 'Zero app download. Guests already have WhatsApp — we deliver photos directly there. Highest open rate of any channel.' },
  { icon: 'cloud_sync', title: 'Camera2Cloud™', desc: 'Photos upload to the cloud the instant you press the shutter. No cables, no card readers, no delays.' },
  { icon: 'palette', title: 'White-Label Galleries', desc: 'Custom domain, your logo, your colors. Guests see your brand — not ours.' },
  { icon: 'mail', title: 'Digital Invites', desc: 'Animated HTML invites with built-in RSVP tracking. No video files, no apps — just a link.' },
  { icon: 'schedule', title: 'Event Itinerary', desc: 'Multi-function events with WhatsApp schedule updates pushed automatically to every guest.' },
  { icon: 'lock', title: 'Guest Privacy Controls', desc: 'Guests choose what others can see. GDPR-mindful architecture built from day one.' },
  { icon: 'tv', title: 'Smart TV Support', desc: 'Any TV browser + WhatsApp OTP = full gallery on the big screen. No casting device needed.' },
  { icon: 'qr_code_2', title: 'Universal QR', desc: 'One QR code routes to whichever event is active. Zero reprinting cost across events.' },
  { icon: 'auto_fix_high', title: 'AI Photo Editing', desc: 'AI-powered color grading and enhancement applied across your entire gallery in minutes, not hours.' },
  { icon: 'move_down', title: 'Storage Transfer', desc: 'Hand over storage to clients after the event. Free up your space, delight your clients.' },
  { icon: 'analytics', title: 'Built-In Analytics', desc: 'Every gallery view tracked. See who opened, downloaded, and shared — your marketing pixel built in.' },
];

export default function Homepage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center text-center pt-28 pb-xl px-gutter overflow-hidden hero-glow grid-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[700px] h-[700px] rounded-full bg-primary-container/12 blur-[130px] animate-orb-1" style={{ top: '-20%', left: '-15%' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary-container/10 blur-[100px] animate-orb-2" style={{ bottom: '-10%', right: '-10%' }} />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-tertiary/8 blur-[80px] animate-orb-1" style={{ top: '30%', right: '15%', animationDelay: '-7s' }} />
        </div>

        <motion.div
          className="relative z-10 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.15, 0.2)}
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/15 border border-primary-container/25 rounded-full text-primary font-label-md text-sm mb-lg">
              <motion.span
                className="w-2 h-2 bg-secondary rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              The complete AI event photo platform
            </span>
          </motion.div>

          <motion.h1 className="font-display text-h1 md:text-display text-on-surface mb-md" variants={fadeInUp}>
            Guests receive their photos{' '}
            <span className="gradient-text">while you're still shooting</span>
          </motion.h1>

          <motion.p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg" variants={fadeInUp}>
            AI face recognition + WhatsApp delivery + real-time Camera2Cloud. The only end-to-end platform built so photographers never have to choose between shooting and sharing.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-md justify-center mb-xl" variants={fadeInUp}>
            <Link to="/businesssignup">
              <motion.button
                className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-label-md text-lg shadow-xl shadow-primary-container/30"
                whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: 0.96 }}
              >
                Start Free — No Credit Card
              </motion.button>
            </Link>
            <Link to="/contactbookdemo">
              <motion.button
                className="glass-card text-on-surface px-lg py-sm rounded-xl font-label-md text-lg flex items-center justify-center gap-xs"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="material-symbols-outlined text-primary">play_circle</span>
                Book a Live Demo
              </motion.button>
            </Link>
          </motion.div>

          {/* Product differentiator chips */}
          <motion.div className="flex flex-wrap justify-center gap-md text-on-surface-variant text-sm font-label-md" variants={fadeInUp}>
            {[
              { icon: 'bolt', label: 'Camera to cloud in ~2 seconds' },
              { icon: 'face_6', label: '99%+ AI match accuracy' },
              { icon: 'phone_iphone', label: 'Zero guest app download' },
              { icon: 'lock', label: 'Privacy-first architecture' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            className="mt-xl relative max-w-4xl mx-auto"
            variants={fadeInUp}
            whileHover={{ y: -8, transition: { duration: 0.4 } }}
          >
            <div className="glass-card rounded-t-3xl border-b-0 overflow-hidden shadow-2xl shadow-primary-container/15">
              <img
                alt="Eventra Event Gallery"
                className="w-full h-auto opacity-85"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEtEVb3uAw2uMYr1wppIeMau5myjwrEnNc20tLDLaGideOVhlWfsbDeDEQyOO8zrW7fF9QdTVDaoosvZaN1khJ6ORkUB3rLKfg5p8HXH3xB_76U2KVNw1mLkLvukRdhGNYwnV5DlfAIKi1luk9ZbXOZ3fieElXXhaz3jU8wDGOidjnxIEJFgeymSo7yoxF0QpfKQ6TjiUvG--7-1xY44WQTV7f15p1TBDnBof7SmTeSkXbotB9c-XNiFmXYxzpZg_GwC3AWHdMv8H5"
              />
            </div>
            <motion.div
              className="absolute -right-4 top-8 glass-card px-4 py-2 rounded-xl border border-secondary-container/30 shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="text-secondary font-label-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Delivered via WhatsApp
              </div>
            </motion.div>
            <motion.div
              className="absolute -left-4 bottom-8 glass-card px-4 py-2 rounded-xl border border-primary-container/30 shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            >
              <div className="text-primary font-label-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
                AI matching live
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── WHY EVENTRA IS DIFFERENT ── */}
      <section className="py-lg border-y border-outline-variant/10 bg-surface-container-lowest">
        <div className="max-w-[1280px] mx-auto px-gutter">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-md"
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            {[
              { value: '~2 sec', label: 'Camera to cloud upload', icon: 'bolt', accent: 'text-secondary' },
              { value: '99%+', label: 'AI face match accuracy', icon: 'face_6', accent: 'text-primary' },
              { value: 'Zero', label: 'App installs for guests', icon: 'phone_iphone', accent: 'text-secondary' },
              { value: 'End-to-End', label: 'One platform, nothing missing', icon: 'check_circle', accent: 'text-primary' },
            ].map((stat, i) => (
              <motion.div key={i} className="text-center p-md glass-card rounded-2xl" variants={fadeInUp}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${stat.accent}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                <div className={`font-display text-h1 gradient-text`}>{stat.value}</div>
                <div className="text-on-surface-variant font-label-md text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-xl max-w-[1280px] mx-auto px-gutter">
        <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <span className="text-secondary font-label-md text-sm uppercase tracking-widest">How It Works</span>
          <h2 className="font-display text-h2 text-on-surface mt-sm">From Capture to Guest — in Seconds</h2>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-md"
          variants={staggerContainer(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {[
            { step: '01', icon: 'camera_alt', color: 'text-primary', bg: 'bg-primary-container/20', border: 'border-t-primary-container', title: 'Photographer Shoots', desc: 'Camera2Cloud uploads photos to the cloud the instant you press the shutter — no cables, no transfers.' },
            { step: '02', icon: 'face_6', color: 'text-secondary', bg: 'bg-secondary-container/20', border: 'border-t-secondary-container', title: 'AI Recognises Faces', desc: 'The AI engine scans every photo and matches each face to the right guest with 99%+ accuracy — in real time.' },
            { step: '03', icon: 'chat', color: 'text-tertiary', bg: 'bg-tertiary/15', border: 'border-t-tertiary', title: 'Guests Get Their Photos', desc: 'Each guest receives their personalised gallery via WhatsApp. Zero app download. While the event is still happening.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`glass-card p-lg rounded-2xl relative overflow-hidden border-t-4 ${item.border}`}
              variants={fadeInUp}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className={`absolute top-4 right-4 font-display font-bold text-5xl opacity-8 ${item.color}`}>{item.step}</div>
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-md`}>
                <span className={`material-symbols-outlined ${item.color} text-h2`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              </div>
              <h3 className="font-display text-h3 text-on-surface mb-sm">{item.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURE SHOWCASE (alternating rows) ── */}
      <section className="py-xl bg-surface-container-low overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-gutter space-y-[100px]">

          {/* Row 1: AI Face Recognition */}
          <div className="flex flex-col md:flex-row items-center gap-xl">
            <motion.div className="flex-1" initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <span className="inline-block px-sm py-1 bg-primary-container/15 border border-primary-container/25 rounded-full text-primary text-sm font-label-md mb-md">FLAGSHIP FEATURE</span>
              <h2 className="font-display text-h2 text-on-surface mb-md">AI Facial Recognition That Actually Works at Scale</h2>
              <p className="text-on-surface-variant text-lg mb-md leading-relaxed">
                Guests upload one selfie. Eventra instantly scans thousands of event photos, finds every picture they appear in, and delivers them privately — before they even leave the venue.
              </p>
              <ul className="space-y-sm">
                {[
                  'Processes 10,000+ photos simultaneously',
                  '99%+ matching accuracy even in crowds',
                  'Handles group shots, angles & low light',
                  'Delivers privately via WhatsApp — no app needed',
                ].map((t, i) => (
                  <li key={i} className="flex items-center gap-sm text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div className="flex-1" initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <div className="glass-card p-3 rounded-3xl hover:rotate-0 transition-transform duration-500" style={{ transform: 'rotate(2deg)' }}>
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrXPcVjOCStQmCeOzdyUua38Q6VxClVm8O1Yrpya3e18mcuLmslKyq4fI3VGb2vhukQHQjC5tnNiAv8yh8bRW2v84U4COX_qdGQy-PZiJ5HFtpn_ssldIq6sIT4p0E3eoUrKiNcl-UHYTs15ltqMy1sTNE1LswdhEpwz9UxU3ub-rIwzZYJ2A-6B-WeNqdYewIYcSDcDZ8uevM9InwFWaA_Va5e9pAaoyrHd9dFWsllj0JynlBWlCa6vuhkiGl0pyaUz-Dub_0DG50" alt="AI Face Recognition" className="rounded-2xl w-full h-[360px] object-cover" />
              </div>
            </motion.div>
          </div>

          {/* Row 2: WhatsApp Bot */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-xl">
            <motion.div className="flex-1" initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <span className="inline-block px-sm py-1 bg-secondary-container/15 border border-secondary-container/25 rounded-full text-secondary text-sm font-label-md mb-md">ZERO APP DOWNLOAD</span>
              <h2 className="font-display text-h2 text-on-surface mb-md">The Only Platform That Delivers via WhatsApp Natively</h2>
              <p className="text-on-surface-variant text-lg mb-md leading-relaxed">
                Every other platform sends guests to a link in a browser. We go further — our AI bot handles RSVP, selfie collection, and photo delivery entirely within WhatsApp. The app guests already have. No friction, period.
              </p>
              <div className="grid grid-cols-2 gap-sm">
                {[
                  { icon: 'mail', label: 'Event invites' },
                  { icon: 'how_to_reg', label: 'RSVP collection' },
                  { icon: 'face_6', label: 'Selfie submission' },
                  { icon: 'photo_library', label: 'Photo delivery' },
                  { icon: 'notifications', label: 'Auto reminders' },
                  { icon: 'update', label: 'Itinerary updates' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-xs text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-secondary text-sm">{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div className="flex-1" initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <div className="glass-card p-3 rounded-3xl hover:rotate-0 transition-transform duration-500" style={{ transform: 'rotate(-2deg)' }}>
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxY6qwVcalK9Q2wRrnoEOE9EQOUkNik75vgVqAo3QkUxpEeWmzELjSp4WQkd2c_VluVqxabjUChyKfrv7z6dUjAvzKlMOBDTss008CAHgnTPyRGfXgWGWABlnqkqdGgwusIAhXmx-Nseo9fnybBnB5SYC9ePTkonOoMKfE3cCBhanEEXaPjWdPDazBE-NRJowI-zBJlo6ekTs5AgtVHIRCI5_oa7KkwWMC-MaJxu_SBcs9VfZhPT4IfwDKKyPYtXAAgjKoXdI2YvVa" alt="WhatsApp Native Delivery" className="rounded-2xl w-full h-[360px] object-cover" />
              </div>
            </motion.div>
          </div>

          {/* Row 3: Camera2Cloud */}
          <div className="flex flex-col md:flex-row items-center gap-xl">
            <motion.div className="flex-1" initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <span className="inline-block px-sm py-1 bg-tertiary/15 border border-tertiary/25 rounded-full text-tertiary text-sm font-label-md mb-md">REAL-TIME UPLOAD</span>
              <h2 className="font-display text-h2 text-on-surface mb-md">Camera2Cloud™ — Shoot and Share Simultaneously</h2>
              <p className="text-on-surface-variant text-lg mb-md leading-relaxed">
                No other platform puts photos in the cloud in real time. Eventra's Camera2Cloud pipes each shot directly to cloud storage the moment you press the shutter. Guests start receiving photos while you're still on location.
              </p>
              <div className="flex flex-wrap gap-sm mb-md">
                {['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus'].map((b) => (
                  <div key={b} className="px-sm py-xs glass-card rounded-lg text-on-surface-variant font-label-md text-sm border border-outline-variant/20">{b}</div>
                ))}
              </div>
              <Link to="/camera2cloudsetup">
                <motion.button className="text-primary font-label-md flex items-center gap-xs hover:gap-sm transition-all" whileHover={{ x: 4 }}>
                  Set up Camera2Cloud <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </motion.button>
              </Link>
            </motion.div>
            <motion.div className="flex-1" initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewport} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <div className="glass-card p-lg rounded-3xl">
                <div className="flex items-center justify-between mb-lg">
                  <div className="text-center flex-1">
                    <div className="w-16 h-16 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-sm mx-auto">
                      <span className="material-symbols-outlined text-primary text-h2" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                    </div>
                    <div className="text-on-surface font-label-md text-sm">Camera</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative">
                    <motion.div className="h-0.5 w-full bg-gradient-to-r from-primary-container to-secondary-container" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className="absolute w-3 h-3 bg-secondary rounded-full shadow-lg shadow-secondary/50" animate={{ x: [-30, 30, -30] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-16 h-16 bg-secondary-container/20 rounded-2xl flex items-center justify-center mb-sm mx-auto">
                      <span className="material-symbols-outlined text-secondary text-h2" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
                    </div>
                    <div className="text-on-surface font-label-md text-sm">Cloud</div>
                  </div>
                </div>
                <div className="space-y-sm">
                  {[
                    { label: 'Upload speed', value: '~2 sec/photo', color: 'text-secondary' },
                    { label: 'Compression', value: 'Zero — full quality', color: 'text-primary' },
                    { label: 'AI processing', value: 'Starts immediately', color: 'text-tertiary' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-sm border-t border-outline-variant/10">
                      <span className="text-on-surface-variant text-sm">{row.label}</span>
                      <span className={`font-label-md text-sm ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FULL FEATURE GRID ── */}
      <section className="py-xl max-w-[1280px] mx-auto px-gutter">
        <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <h2 className="font-display text-h2 text-on-surface mb-sm">Everything in One Platform</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">No juggling tools. Every feature you need to run world-class events — built-in, from day one.</p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md"
          variants={staggerContainer(0.07)}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="glass-card p-md rounded-2xl group cursor-default"
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2, ease: 'easeOut' } }}
            >
              <div className="w-10 h-10 bg-primary-container/15 rounded-xl flex items-center justify-center mb-md group-hover:bg-primary-container/30 transition-colors duration-200">
                <span className="material-symbols-outlined text-primary">{f.icon}</span>
              </div>
              <h3 className="font-display text-h3 text-on-surface mb-xs">{f.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── WHAT MAKES EVENTRA A GAMECHANGER ── */}
      <section className="py-xl bg-surface-container-lowest dot-bg">
        <div className="max-w-[1280px] mx-auto px-gutter">
          <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="font-display text-h2 text-on-surface mb-sm">Why Eventra is a Gamechanger</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">The market had gallery hosting. We built the entire pipeline — from shutter click to guest download.</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-md"
            variants={staggerContainer(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            {[
              {
                icon: 'compare_arrows',
                title: 'vs. Traditional Platforms',
                points: [
                  'Others: Upload manually after the event',
                  'Eventra: Real-time Camera2Cloud',
                  'Others: Browser gallery link only',
                  'Eventra: WhatsApp-native delivery',
                  'Others: Guests download everything',
                  'Eventra: AI picks only your photos',
                ],
                accent: 'text-primary',
                bg: 'bg-primary-container/10',
              },
              {
                icon: 'auto_awesome',
                title: 'What Only We Do',
                points: [
                  'Camera-to-cloud in under 2 seconds',
                  'AI delivery WHILE event is happening',
                  'WhatsApp bot — entire flow, no browser',
                  'Guest privacy controls & GDPR design',
                  'White-label with your domain & brand',
                  'Smart TV gallery — no casting device',
                ],
                accent: 'text-secondary',
                bg: 'bg-secondary/10',
                featured: true,
              },
              {
                icon: 'trending_up',
                title: 'Business Impact',
                points: [
                  'Photographers — shoot & deliver same day',
                  'Agencies — impress clients with real-time',
                  'Enterprises — GDPR-ready from day one',
                  'Hotels & venues — white-label brand',
                  'Colleges — handle 50K+ guests per event',
                  'Built-in analytics for your marketing stack',
                ],
                accent: 'text-primary',
                bg: 'bg-primary-container/10',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                className={`glass-card p-lg rounded-2xl relative ${card.featured ? 'border-2 border-secondary/40 glow-border' : ''}`}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                {card.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-background px-md py-xs rounded-full text-xs font-bold whitespace-nowrap">
                    ✦ Our Unique Advantage
                  </div>
                )}
                <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-md`}>
                  <span className={`material-symbols-outlined text-h2 ${card.accent}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                </div>
                <h3 className="font-display text-h3 text-on-surface mb-md">{card.title}</h3>
                <ul className="space-y-sm">
                  {card.points.map((p, j) => (
                    <li key={j} className={`text-sm flex items-start gap-xs ${p.startsWith('Eventra:') ? 'text-on-surface font-label-md' : 'text-on-surface-variant'}`}>
                      <span className={`material-symbols-outlined text-sm mt-0.5 flex-shrink-0 ${p.startsWith('Eventra:') ? card.accent : 'text-outline'}`} style={{ fontVariationSettings: `'FILL' ${p.startsWith('Eventra:') ? 1 : 0}` }}>
                        {p.startsWith('Eventra:') ? 'check_circle' : 'close'}
                      </span>
                      {p.replace('Eventra: ', '').replace('Others: ', '')}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="py-xl max-w-[1280px] mx-auto px-gutter">
        <motion.div className="text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <h2 className="font-display text-h2 text-on-surface mb-sm">Storage-Based. No Per-Event Fees.</h2>
          <p className="text-on-surface-variant">Scale your storage as your business grows. All AI features included in every plan — no add-ons.</p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-md items-center"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          {[
            { name: 'Starter', storage: '100 GB', price: '₹999', period: '/month', desc: 'For solo photographers starting out', featured: false },
            { name: 'Professional', storage: '1 TB', price: '₹3,999', period: '/month', desc: 'For studios doing regular events', featured: true },
            { name: 'Studio', storage: '2 TB', price: '₹6,999', period: '/month', desc: 'For high-volume agencies', featured: false },
          ].map((plan, i) => (
            <motion.div
              key={i}
              className={`glass-card p-lg rounded-2xl flex flex-col relative ${plan.featured ? 'border-2 border-primary-container glow-border' : ''}`}
              variants={fadeInUp}
              style={plan.featured ? { transform: 'scale(1.04)' } : {}}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container px-md py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  ✦ Most Popular
                </div>
              )}
              <div className="font-display text-h3 mb-xs">{plan.name}</div>
              <div className="text-outline text-sm mb-sm font-label-md">{plan.storage} Storage</div>
              <div className="font-display text-h1 text-on-surface mb-xs">
                {plan.price}<span className="text-body-md font-body-md text-on-surface-variant">{plan.period}</span>
              </div>
              <p className="text-on-surface-variant text-sm mb-lg">{plan.desc}</p>
              <Link to="/businesssignup" className="mt-auto">
                <motion.button
                  className={`w-full py-sm rounded-xl font-label-md transition-colors ${plan.featured ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/25' : 'border border-outline-variant text-on-surface hover:bg-surface-variant'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        <div className="text-center mt-lg">
          <Link to="/pricing">
            <motion.span className="text-primary font-label-md inline-flex items-center gap-xs cursor-pointer" whileHover={{ x: 4 }}>
              See all plans and compare features <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </motion.span>
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-xl px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            className="glass-card rounded-3xl p-lg md:p-xl text-center overflow-hidden relative"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <div className="absolute inset-0 bg-primary-container/8 -z-10" />
            <motion.div
              className="absolute w-96 h-96 bg-primary-container/15 rounded-full blur-3xl -top-24 -right-24 pointer-events-none"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl -bottom-16 -left-16 pointer-events-none"
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 7, repeat: Infinity, delay: 1.5 }}
            />
            <div className="relative z-10">
              <h2 className="font-display text-h1 text-on-surface mb-md">Ready to Transform Your Events?</h2>
              <p className="text-on-surface-variant text-lg max-w-2xl mx-auto mb-lg">
                Be among the first photographers and event professionals to use Eventra. Start for free — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-sm justify-center max-w-md mx-auto">
                <input
                  className="flex-grow bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Enter your email"
                  type="email"
                />
                <Link to="/businesssignup">
                  <motion.button
                    className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-label-md whitespace-nowrap shadow-lg shadow-primary-container/30"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Get Early Access
                  </motion.button>
                </Link>
              </div>
              <p className="text-outline text-sm mt-md">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
