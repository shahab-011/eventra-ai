import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fadeInUp, staggerContainer, viewport } from '../utils/animations';

const tabs = ['All Features', 'AI & Automation', 'Photo Delivery', 'Event Management', 'Business Tools'];

const featureCategories = [
  {
    id: 'AI & Automation', icon: 'psychology', color: 'text-primary', bg: 'bg-primary-container/20', border: 'border-primary-container/30',
    features: [
      { icon: 'face_6', title: 'AI Facial Recognition', badge: 'Flagship', desc: 'Guest uploads one selfie → AI scans all event photos → matches faces → delivers only their photos via WhatsApp. Works on 10,000+ photos simultaneously. Handles group shots, angles, low light.' },
      { icon: 'cloud_sync', title: 'Camera2Cloud™', badge: 'Unique', desc: 'Proprietary desktop utility connects your camera via USB or WiFi. Photos upload automatically as you shoot. No card readers, no manual transfers. Supports Canon, Nikon, Sony, Fujifilm.' },
      { icon: 'auto_fix_high', title: 'AI Photo Editing with 3D LUTs', badge: 'New', desc: 'Professional-grade AI color grading using 3D LUTs. Apply consistent style to entire events of thousands of photos in minutes. Corrects exposure, white balance, color temperature.' },
      { icon: 'label', title: 'AI Auto-Tagging & Organisation', desc: 'Automatically tags photos by content: ceremony, reception, portraits, group shots. Assigns to sub-events and reduces manual album curation from hours to minutes.' },
    ]
  },
  {
    id: 'Photo Delivery', icon: 'send', color: 'text-secondary', bg: 'bg-secondary-container/20', border: 'border-secondary-container/30',
    features: [
      { icon: 'chat', title: 'Smart WhatsApp Bot', desc: 'AI-powered conversational bot using Meta\'s WhatsApp Business API. Handles invitations, RSVP collection, selfie submission, photo delivery, itinerary updates, and automated reminders. 93% open rate. Zero app download for guests.' },
      { icon: 'photo_library', title: 'Cloud Gallery System', desc: '14+ visual themes. Netflix-style video rows, justified photo grid, portfolio view. No login required for guests. Supports 4K video playback without compression. Global CDN delivery.' },
      { icon: 'tv', title: 'Smart TV Support', desc: 'Guests type the gallery URL in any smart TV browser, authenticate via WhatsApp OTP, and view the full gallery in full-screen. No TV app installation required.' },
      { icon: 'qr_code_2', title: 'Universal QR Code System', desc: 'Per-event QR codes AND a universal Common QR Code that routes to whichever event is active — saving businesses print costs across multiple events.' },
    ]
  },
  {
    id: 'Event Management', icon: 'event', color: 'text-tertiary', bg: 'bg-tertiary/15', border: 'border-tertiary/30',
    features: [
      { icon: 'schedule', title: 'Multi-Day Event Itinerary', desc: 'Create full event itineraries with sub-events (Mehendi, Sangeet, Reception). Each has its own time, venue, team assignments, and media bucket. Push real-time updates to guests via WhatsApp.' },
      { icon: 'group', title: 'Guest Management System', desc: 'Add guests individually or via CSV import. Track RSVP, selfie submission, photo delivery, and WhatsApp delivery per guest. Bulk actions: send reminder, resend photos, export list.' },
      { icon: 'supervised_user_circle', title: 'Team Collaboration & Roles', desc: 'Multiple team accounts under one business login. Role-based permissions (Owner, Co-host, Vendor, Guest). Individual email logins per team member. Supports 10 simultaneous photographers.' },
      { icon: 'check_box', title: 'Client Proofing System', desc: 'Interactive photo selection. Clients mark favourites, leave per-photo feedback, and approve final sets in the gallery. Replaces email chains and Google Drive.' },
    ]
  },
  {
    id: 'Business Tools', icon: 'business_center', color: 'text-primary', bg: 'bg-primary-container/20', border: 'border-primary-container/30',
    features: [
      { icon: 'palette', title: 'White-Label Galleries', desc: 'Custom domain, logo, brand colors, and fonts. Your gallery appears as your own product. Custom SSL certificates. Pixel integration for lead tracking from gallery visits.' },
      { icon: 'mail', title: 'Web-Animated Digital Invites', badge: 'World First', desc: 'Actual interactive HTML/CSS/JS animated invitations delivered as web URLs. 100+ design templates, RSVP form embedded, guest pool feature, Lottie animations. Share via WhatsApp link — no file download.' },
      { icon: 'analytics', title: 'Pixel Integration (Lead Gen)', desc: 'Meta Pixel + Google Analytics on client galleries. Track visits, downloads, QR scans. Turn every gallery view into a measurable lead for your booking funnel.' },
      { icon: 'move_down', title: 'Event Transfer (Storage Handoff)', desc: 'After an event, transfer ownership to the client. Your storage is freed. Client retains full access at personal storage rates. Automated billing change on transfer.' },
    ]
  },
];

const competitors = [
  { name: 'Eventra ★', face: '✓', whatsapp: '✓ Native Bot', c2c: '✓', wl: '✓', inv: '✓ Animated', tv: '✓', hi: true },
  { name: 'AlgoShare', face: '✓', whatsapp: '~ Partial', c2c: '✗', wl: '✓', inv: '✗', tv: '✗', hi: false },
  { name: 'Premagic', face: '✓', whatsapp: '~ Partial', c2c: '✗', wl: '~ Limited', inv: '✗', tv: '✗', hi: false },
  { name: 'Photier', face: '✓', whatsapp: '✗', c2c: '✗', wl: '✗', inv: '✗', tv: '✗', hi: false },
  { name: 'Pixieset', face: '✗', whatsapp: '✗', c2c: '✗', wl: '✓', inv: '✗', tv: '✗', hi: false },
  { name: 'Google Photos', face: '✓', whatsapp: '✗', c2c: '✗', wl: '✗', inv: '✗', tv: '~ Cast', hi: false },
];

export default function FeaturesOverview() {
  const [activeTab, setActiveTab] = useState('All Features');
  const cats = activeTab === 'All Features' ? featureCategories : featureCategories.filter(c => c.id === activeTab);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <section className="pt-32 pb-lg px-gutter hero-glow grid-bg overflow-hidden">
        <div className="max-w-[1280px] mx-auto text-center">
          <motion.div variants={staggerContainer(0.12)} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/15 border border-primary-container/25 rounded-full text-primary font-label-md text-sm mb-md">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> Full Feature Reference
              </span>
            </motion.div>
            <motion.h1 className="font-display text-h1 md:text-display text-on-surface mb-md" variants={fadeInUp}>
              Every Tool to Run <span className="gradient-text">Flawless Events</span>
            </motion.h1>
            <motion.p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg" variants={fadeInUp}>
              From real-time camera uploads to AI face matching to WhatsApp delivery — every feature built into one platform.
            </motion.p>
            <motion.div className="flex flex-wrap justify-center gap-sm" variants={fadeInUp}>
              {tabs.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-md py-xs rounded-full font-label-md text-sm transition-all ${activeTab === tab ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/25' : 'glass-card text-on-surface-variant hover:text-on-surface border border-outline-variant/20'}`}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                >
                  {tab}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-gutter pb-xl mt-xl">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            {cats.map((cat) => (
              <section key={cat.id} className="mb-xl">
                <motion.div className="flex items-center gap-md mb-lg" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
                  <div className={`w-12 h-12 ${cat.bg} rounded-xl flex items-center justify-center border ${cat.border}`}>
                    <span className={`material-symbols-outlined ${cat.color} text-h2`} style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                  </div>
                  <h2 className="font-display text-h2 text-on-surface">{cat.id}</h2>
                </motion.div>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-md" variants={staggerContainer(0.08)} initial="hidden" whileInView="visible" viewport={viewport}>
                  {cat.features.map((f, idx) => (
                    <motion.div
                      key={f.title}
                      className={`glass-card p-lg rounded-2xl relative overflow-hidden group ${idx === 0 ? 'md:col-span-2' : ''}`}
                      variants={fadeInUp}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-md">
                          <div className={`w-11 h-11 ${cat.bg} rounded-xl flex items-center justify-center border ${cat.border}`}>
                            <span className={`material-symbols-outlined ${cat.color}`}>{f.icon}</span>
                          </div>
                          {f.badge && (
                            <span className={`px-sm py-xs rounded-full text-xs font-bold ${
                              f.badge === 'Flagship' ? 'bg-primary-container/20 text-primary' :
                              f.badge === 'Unique' ? 'bg-secondary-container/20 text-secondary' :
                              f.badge === 'New' ? 'bg-tertiary/15 text-tertiary' :
                              'bg-surface-variant text-on-surface-variant'
                            }`}>{f.badge}</span>
                          )}
                        </div>
                        <h3 className="font-display text-h3 text-on-surface mb-sm">{f.title}</h3>
                        <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            ))}
          </motion.div>
        </AnimatePresence>

        {activeTab === 'All Features' && (
          <motion.section className="mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <div className="text-center mb-lg">
              <span className="text-secondary font-label-md text-sm uppercase tracking-widest">Competitive Landscape</span>
              <h2 className="font-display text-h2 text-on-surface mt-sm">How Eventra Compares</h2>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/20">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/20">
                    <th className="py-md px-lg text-left text-on-surface-variant font-label-md">Platform</th>
                    {['Face Recog.', 'WhatsApp', 'Camera2Cloud', 'White Label', 'Invites', 'Smart TV'].map(h => (
                      <th key={h} className="py-md px-md text-center text-on-surface-variant font-label-md">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((r, i) => (
                    <motion.tr key={r.name} className={`border-b border-outline-variant/10 ${r.hi ? 'bg-primary-container/8' : 'hover:bg-surface-container/40'} transition-colors`}
                      initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                      <td className={`py-md px-lg font-display text-base ${r.hi ? 'text-primary font-bold' : 'text-on-surface'}`}>{r.name}</td>
                      {[r.face, r.whatsapp, r.c2c, r.wl, r.inv, r.tv].map((v, j) => (
                        <td key={j} className="py-md px-md text-center">
                          <span className={`font-label-md text-xs ${v.startsWith('✓') ? 'text-secondary' : v.startsWith('~') ? 'text-yellow-400' : 'text-outline'}`}>{v}</span>
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        <motion.div className="glass-card rounded-3xl p-xl text-center relative overflow-hidden" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <div className="absolute inset-0 bg-primary-container/6 pointer-events-none" />
          <h2 className="font-display text-h2 text-on-surface mb-md relative z-10">See it all in action</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-lg relative z-10">Book a live demo and watch the full AI pipeline run on a real event gallery.</p>
          <div className="flex flex-col sm:flex-row gap-md justify-center relative z-10">
            <Link to="/contactbookdemo"><motion.button className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-label-md" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>Book a Live Demo</motion.button></Link>
            <Link to="/pricing"><motion.button className="glass-card text-on-surface px-lg py-sm rounded-xl font-label-md border border-outline-variant/20" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>View Pricing</motion.button></Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
