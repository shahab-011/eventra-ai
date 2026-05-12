import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const PERIODS = ['7 Days', '30 Days', '3 Months', 'All Time'];

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

        <div className="px-lg py-lg">
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
        </div>
      </div>
    </AppSidebar>
  );
}
