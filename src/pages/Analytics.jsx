import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const PERIODS = ['7 Days', '30 Days', '3 Months', 'All Time'];
const TABS = ['Overview', 'Meta Pixel', 'WhatsApp', 'Export'];

const BAR_DATA = [
  { day: 'Mon', uploads: 420, deliveries: 380 },
  { day: 'Tue', uploads: 680, deliveries: 610 },
  { day: 'Wed', uploads: 340, deliveries: 290 },
  { day: 'Thu', uploads: 890, deliveries: 820 },
  { day: 'Fri', uploads: 1240, deliveries: 1100 },
  { day: 'Sat', uploads: 2100, deliveries: 1920 },
  { day: 'Sun', uploads: 1680, deliveries: 1540 },
];

const maxUploads = Math.max(...BAR_DATA.map(d => d.uploads));

export default function Analytics() {
  const [period, setPeriod] = useState('7 Days');
  const [activeTab, setActiveTab] = useState('Overview');
  const [pixels, setPixels] = useState([
    { id: 1, name: 'Sharma Studios Meta Pixel', platform: 'meta', pixelId: '1234567890123', event: 'Sharma–Verma Wedding', status: 'active', fires: 312 },
    { id: 2, name: 'Google Ads Tag', platform: 'google', pixelId: 'AW-987654321', event: 'All Events', status: 'active', fires: 840 },
  ]);
  const [showAddPixel, setShowAddPixel] = useState(false);
  const [newPixel, setNewPixel] = useState({ name: '', platform: 'meta', pixelId: '', event: 'All Events' });
  const [pixelSaved, setPixelSaved] = useState(false);

  const addPixel = () => {
    if (!newPixel.pixelId) return;
    setPixels(prev => [...prev, { ...newPixel, id: Date.now(), status: 'active', fires: 0 }]);
    setPixelSaved(true);
    setTimeout(() => { setPixelSaved(false); setShowAddPixel(false); setNewPixel({ name: '', platform: 'meta', pixelId: '', event: 'All Events' }); }, 2000);
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Analytics</h1>
          <div className="flex gap-xs">
            {PERIODS.map(p => (
              <motion.button
                key={p}
                className={`px-sm py-xs rounded-xl text-xs font-label-md border ${period === p ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20'}`}
                onClick={() => setPeriod(p)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {p}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="border-b border-outline-variant/10 px-lg bg-background/60">
          <div className="flex gap-xs">
            {TABS.map(tab => (
              <motion.button
                key={tab}
                className={`py-sm px-md text-sm font-label-md relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="analytics-tab" />}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-lg py-lg">
          <AnimatePresence mode="wait">

          {/* Meta Pixel Tab */}
          {activeTab === 'Meta Pixel' && (
            <motion.div key="pixel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-lg">
              {/* Explainer */}
              <div className="glass-card p-lg rounded-2xl border border-primary-container/20 bg-primary-container/5">
                <div className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary text-h2 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>ads_click</span>
                  <div>
                    <h3 className="font-display text-h3 text-on-surface mb-xs">Retarget Event Guests with Ads</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">When a guest views their gallery, Eventra fires your Meta or Google pixel — so you can run retargeting ads to every wedding guest who saw your work. They become warm leads for future bookings, without any form fills or opt-ins.</p>
                    <div className="flex flex-wrap gap-sm mt-md">
                      {['No form fills needed', 'GDPR-compliant disclosure', 'Per-event pixel control', 'Real-time fire tracking'].map((f, i) => (
                        <span key={i} className="text-xs bg-primary-container/15 text-primary px-sm py-xs rounded-full flex items-center gap-xs">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>{f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pixel list */}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-h3 text-on-surface">Your Pixels</h3>
                <motion.button
                  className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
                  onClick={() => setShowAddPixel(true)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Pixel
                </motion.button>
              </div>

              <div className="space-y-sm">
                {pixels.map((px, i) => (
                  <motion.div key={px.id} className="glass-card p-md rounded-2xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <div className="flex items-center gap-md flex-wrap">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${px.platform === 'meta' ? 'bg-blue-500/15' : 'bg-green-500/15'}`}>
                        <span className={`material-symbols-outlined ${px.platform === 'meta' ? 'text-blue-400' : 'text-green-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{px.platform === 'meta' ? 'thumb_up' : 'ads_click'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm">
                          <span className="font-label-md text-on-surface">{px.name}</span>
                          <span className={`text-xs px-sm py-0.5 rounded-full border font-label-md ${px.platform === 'meta' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-green-400 bg-green-400/10 border-green-400/20'}`}>
                            {px.platform === 'meta' ? 'Meta / Facebook' : 'Google Ads'}
                          </span>
                          <span className="text-xs bg-secondary/10 text-secondary border border-secondary/20 px-sm py-0.5 rounded-full">Active</span>
                        </div>
                        <div className="text-on-surface-variant text-xs mt-xs font-mono">Pixel ID: {px.pixelId}</div>
                        <div className="text-on-surface-variant text-xs">Attached to: {px.event}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-display text-h3 text-secondary">{px.fires.toLocaleString()}</div>
                        <div className="text-on-surface-variant text-xs">fires this period</div>
                      </div>
                      <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-red-400" whileHover={{ scale: 1.05 }} onClick={() => setPixels(prev => prev.filter(p => p.id !== px.id))}>
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* How it works */}
              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
                  {[
                    { step: '1', icon: 'qr_code_scanner', title: 'Guest scans QR', desc: 'Guest opens their gallery link from WhatsApp or QR code' },
                    { step: '2', icon: 'ads_click', title: 'Pixel fires', desc: 'Eventra fires your Meta/Google pixel as the gallery loads' },
                    { step: '3', icon: 'person_add', title: 'Audience builds', desc: 'Guest is added to your Custom Audience on Meta/Google' },
                    { step: '4', icon: 'campaign', title: 'Run retargeting ads', desc: 'Show ads to wedding guests for future event packages' },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="relative inline-block mb-sm">
                        <div className="w-12 h-12 bg-primary-container/15 rounded-2xl flex items-center justify-center mx-auto">
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container text-xs font-bold">{s.step}</div>
                      </div>
                      <div className="font-label-md text-sm text-on-surface mb-xs">{s.title}</div>
                      <div className="text-on-surface-variant text-xs">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Overview Tab (existing content) */}
          {activeTab === 'Overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {/* KPI row */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Total Events', value: '14', delta: '+3', pos: true, icon: 'event', color: 'text-primary' },
              { label: 'Guests Served', value: '4,240', delta: '+840', pos: true, icon: 'group', color: 'text-secondary' },
              { label: 'Photos Delivered', value: '12,220', delta: '+2,400', pos: true, icon: 'photo_library', color: 'text-secondary' },
              { label: 'WhatsApp Open Rate', value: '93%', delta: '+2%', pos: true, icon: 'chat', color: 'text-[#25D366]' },
            ].map((m, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <div className="flex items-start justify-between mb-sm">
                  <span className={`material-symbols-outlined text-h2 ${m.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                  <span className={`text-xs font-label-md px-xs py-xs rounded-full ${m.pos ? 'bg-secondary/10 text-secondary' : 'bg-red-500/10 text-red-400'}`}>
                    {m.delta}
                  </span>
                </div>
                <div className="font-display text-h1 text-on-surface">{m.value}</div>
                <div className="text-on-surface-variant text-sm">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
            {/* Bar chart */}
            <motion.div className="lg:col-span-2 glass-card p-lg rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-display text-h3 text-on-surface">Daily Activity</h3>
                <div className="flex items-center gap-md text-xs">
                  <div className="flex items-center gap-xs"><div className="w-2 h-2 rounded-full bg-primary-container" /><span className="text-on-surface-variant">Uploads</span></div>
                  <div className="flex items-center gap-xs"><div className="w-2 h-2 rounded-full bg-secondary" /><span className="text-on-surface-variant">Delivered</span></div>
                </div>
              </div>
              <div className="flex items-end gap-sm h-40">
                {BAR_DATA.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full flex gap-xs items-end" style={{ height: '120px' }}>
                      <motion.div
                        className="flex-1 bg-primary-container/40 rounded-t-lg"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.uploads / maxUploads) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                        style={{ minHeight: '4px' }}
                      />
                      <motion.div
                        className="flex-1 bg-secondary/60 rounded-t-lg"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.deliveries / maxUploads) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 + 0.05, ease: 'easeOut' }}
                        style={{ minHeight: '4px' }}
                      />
                    </div>
                    <span className="text-on-surface-variant text-xs">{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top events */}
            <motion.div className="glass-card p-lg rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
              <h3 className="font-display text-h3 text-on-surface mb-md">Top Events</h3>
              <div className="space-y-sm">
                {[
                  { name: 'IIT Convocation', media: 7800, delivered: 1410, pct: 91 },
                  { name: 'Sharma Wedding', media: 3240, delivered: 721, pct: 86 },
                  { name: 'TechCorp Meet', media: 1180, delivered: 310, pct: 79 },
                ].map((ev, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="flex justify-between text-sm mb-xs">
                      <span className="text-on-surface font-label-md">{ev.name}</span>
                      <span className="text-secondary font-label-md">{ev.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${ev.pct}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                    <div className="text-on-surface-variant text-xs mt-xs">{ev.media.toLocaleString()} photos · {ev.delivered.toLocaleString()} delivered</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {/* Delivery funnel */}
            <motion.div className="glass-card p-lg rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
              <h3 className="font-display text-h3 text-on-surface mb-md">Delivery Funnel</h3>
              <div className="space-y-sm">
                {[
                  { label: 'Photos Uploaded', value: 12220, pct: 100, color: 'bg-outline-variant' },
                  { label: 'AI Matched', value: 9180, pct: 75, color: 'bg-primary-container' },
                  { label: 'WhatsApp Sent', value: 7840, pct: 64, color: 'bg-[#25D366]' },
                  { label: 'Links Opened', value: 6920, pct: 57, color: 'bg-secondary' },
                  { label: 'Photos Downloaded', value: 6100, pct: 50, color: 'bg-secondary' },
                ].map((r, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-xs">
                      <span>{r.label}</span>
                      <span className="text-on-surface font-label-md">{r.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${r.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${r.pct}%` }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Guest engagement */}
            <motion.div className="glass-card p-lg rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
              <h3 className="font-display text-h3 text-on-surface mb-md">Guest Engagement</h3>
              <div className="space-y-md">
                {[
                  { label: 'Selfie Submission Rate', value: '92%', icon: 'face_6', color: 'text-secondary' },
                  { label: 'WhatsApp Open Rate', value: '93%', icon: 'chat', color: 'text-[#25D366]' },
                  { label: 'Gallery Click Rate', value: '78%', icon: 'touch_app', color: 'text-primary' },
                  { label: 'Download Rate', value: '67%', icon: 'download', color: 'text-secondary' },
                  { label: 'Share Rate', value: '31%', icon: 'share', color: 'text-primary' },
                ].map((m, i) => (
                  <motion.div key={i} className="flex items-center justify-between" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                    <div className="flex items-center gap-sm">
                      <span className={`material-symbols-outlined text-sm ${m.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                      <span className="text-on-surface-variant text-sm">{m.label}</span>
                    </div>
                    <span className={`font-display text-base ${m.color}`}>{m.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Revenue */}
            <motion.div className="glass-card p-lg rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
              <h3 className="font-display text-h3 text-on-surface mb-md">Platform Usage</h3>
              <div className="space-y-sm mb-lg">
                {[
                  { label: 'Storage Used', value: '34 GB', max: '50 GB', pct: 68, color: 'bg-primary-container' },
                  { label: 'AI Credits', value: '8,400', max: '10,000', pct: 84, color: 'bg-secondary' },
                  { label: 'WhatsApp Messages', value: '2,841', max: '5,000', pct: 57, color: 'bg-[#25D366]' },
                ].map((u, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-xs">
                      <span>{u.label}</span>
                      <span className="text-on-surface font-label-md">{u.value} / {u.max}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${u.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${u.pct}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-sm">
                <div className="text-primary font-label-md text-sm mb-xs">Current Plan: Professional</div>
                <div className="text-on-surface-variant text-xs">Renews June 1, 2026 · ₹3,999/mo</div>
              </div>
            </motion.div>
          </div>
          </motion.div>
          )}

          {/* WhatsApp Tab */}
          {activeTab === 'WhatsApp' && (
            <motion.div key="whatsapp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {[
                  { label: 'Messages Sent', value: '2,841', icon: 'send', color: 'text-[#25D366]' },
                  { label: 'Open Rate', value: '93%', icon: 'mark_email_read', color: 'text-secondary' },
                  { label: 'Link Clicks', value: '2,123', icon: 'touch_app', color: 'text-primary' },
                  { label: 'Bot Interactions', value: '1,840', icon: 'smart_toy', color: 'text-secondary' },
                ].map((s, i) => (
                  <motion.div key={i} className="glass-card p-md rounded-2xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }}>
                    <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    <div className="font-display text-h2 text-on-surface">{s.value}</div>
                    <div className="text-on-surface-variant text-sm">{s.label}</div>
                  </motion.div>
                ))}
              </div>
              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Message Breakdown</h3>
                <div className="space-y-sm">
                  {[
                    { label: 'Photo ready notifications', count: 1240, pct: 87 },
                    { label: 'RSVP confirmations', count: 840, pct: 62 },
                    { label: 'Itinerary reminders', count: 420, pct: 31 },
                    { label: 'Guest selfie requests', count: 341, pct: 25 },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm text-on-surface-variant mb-xs">
                        <span>{m.label}</span>
                        <span className="text-on-surface font-label-md">{m.count.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                        <motion.div className="h-full bg-[#25D366]/60 rounded-full" initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Export Tab */}
          {activeTab === 'Export' && (
            <motion.div key="export" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-lg space-y-md">
              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Export Analytics Report</h3>
                <div className="space-y-sm">
                  {[
                    { label: 'Event Summary (PDF)', icon: 'picture_as_pdf', desc: 'Overview of all events, guests, and delivery rates' },
                    { label: 'Guest Engagement (CSV)', icon: 'table_chart', desc: 'Per-guest open rates, downloads, and interactions' },
                    { label: 'WhatsApp Report (PDF)', icon: 'chat', desc: 'Message volumes, open rates, bot interactions' },
                    { label: 'Storage Report (CSV)', icon: 'storage', desc: 'Per-event storage usage and breakdown' },
                  ].map((r, i) => (
                    <motion.div key={i} className="flex items-center gap-md p-md bg-surface-container rounded-xl" whileHover={{ x: 4 }}>
                      <span className="material-symbols-outlined text-primary text-h3" style={{ fontVariationSettings: "'FILL' 1" }}>{r.icon}</span>
                      <div className="flex-1">
                        <div className="font-label-md text-sm text-on-surface">{r.label}</div>
                        <div className="text-on-surface-variant text-xs">{r.desc}</div>
                      </div>
                      <motion.button className="px-sm py-xs bg-primary-container text-on-primary-container rounded-lg text-xs font-label-md" whileHover={{ scale: 1.05 }}>Export</motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          </AnimatePresence>
        </div>
      </div>

      {/* Add Pixel Modal */}
      <AnimatePresence>
        {showAddPixel && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setShowAddPixel(false)}>
            <motion.div className="bg-surface-container rounded-3xl p-xl w-full max-w-md shadow-2xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h2 className="font-display text-h2 text-on-surface mb-lg">Add Pixel</h2>
              <div className="space-y-md">
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-sm block">Platform</label>
                  <div className="flex gap-sm">
                    {[{ id: 'meta', label: 'Meta / Facebook', icon: 'thumb_up', color: 'text-blue-400' }, { id: 'google', label: 'Google Ads', icon: 'ads_click', color: 'text-green-400' }].map(p => (
                      <motion.button key={p.id} className={`flex-1 py-sm rounded-xl text-sm font-label-md flex items-center justify-center gap-xs border ${newPixel.platform === p.id ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20'}`} onClick={() => setNewPixel(n => ({ ...n, platform: p.id }))} whileHover={{ scale: 1.02 }}>
                        <span className={`material-symbols-outlined text-sm ${newPixel.platform === p.id ? '' : p.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>{p.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                {[
                  { key: 'name', label: 'Pixel Name', placeholder: 'e.g. Sharma Studios Meta Pixel' },
                  { key: 'pixelId', label: newPixel.platform === 'meta' ? 'Meta Pixel ID' : 'Google Tag ID', placeholder: newPixel.platform === 'meta' ? '1234567890123' : 'AW-XXXXXXXXX' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-on-surface-variant text-sm font-label-md mb-xs block">{f.label}</label>
                    <input value={newPixel[f.key]} onChange={e => setNewPixel(n => ({ ...n, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-surface-variant border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-xs block">Attach to Event</label>
                  <select value={newPixel.event} onChange={e => setNewPixel(n => ({ ...n, event: e.target.value }))} className="w-full bg-surface-variant border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none">
                    <option>All Events</option>
                    <option>Sharma–Verma Wedding</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-sm mt-lg">
                <motion.button className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25 flex items-center justify-center gap-xs" onClick={addPixel} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {pixelSaved ? <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Saved!</> : 'Add Pixel'}
                </motion.button>
                <motion.button className="px-lg py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => setShowAddPixel(false)} whileHover={{ scale: 1.02 }}>Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppSidebar>
  );
}
