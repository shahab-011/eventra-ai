import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';

const TEMPLATES = [
  { id: 'modern', label: 'Modern Minimal', bg: 'from-[#1a1a2e] to-[#16213e]', accent: '#7c3aed' },
  { id: 'floral', label: 'Floral Elegance', bg: 'from-[#2d1b2e] to-[#1a0a1a]', accent: '#f472b6' },
  { id: 'gold', label: 'Royal Gold', bg: 'from-[#1c1200] to-[#0a0800]', accent: '#f59e0b' },
  { id: 'pastel', label: 'Pastel Dream', bg: 'from-[#0f2027] to-[#203a43]', accent: '#43e5b1' },
];

export default function InviteBuilder() {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [form, setForm] = useState({
    title: 'Sharma–Verma Wedding',
    subtitle: 'You are cordially invited',
    date: 'May 18, 2026',
    time: '10:00 AM onwards',
    venue: 'The Grand Ballroom, Mumbai',
    host: 'Rajesh & Sunita Sharma',
    rsvpDate: 'May 10, 2026',
    note: 'Dress code: Traditional / Formal',
  });
  const [shared, setShared] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Invite Builder</h1>
          <div className="flex items-center gap-sm">
            <motion.button
              className="px-md py-xs bg-surface-container border border-outline-variant/20 text-on-surface-variant rounded-xl text-sm font-label-md flex items-center gap-xs"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm">preview</span> Preview
            </motion.button>
            <motion.button
              className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
              onClick={() => setShared(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm">share</span> Share Invite
            </motion.button>
          </div>
        </motion.div>

        <div className="px-lg py-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            {/* Editor */}
            <div className="space-y-lg">
              {/* Template picker */}
              <div>
                <h3 className="font-display text-h3 text-on-surface mb-md">Choose Template</h3>
                <div className="grid grid-cols-2 gap-sm">
                  {TEMPLATES.map(t => (
                    <motion.div
                      key={t.id}
                      className={`rounded-xl overflow-hidden cursor-pointer border-2 ${template.id === t.id ? 'border-primary-container' : 'border-transparent'}`}
                      onClick={() => setTemplate(t)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className={`h-16 bg-gradient-to-br ${t.bg} flex items-end p-sm`}>
                        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: t.accent }} />
                      </div>
                      <div className={`p-xs text-xs font-label-md ${template.id === t.id ? 'text-primary bg-primary-container/10' : 'text-on-surface-variant bg-surface-container'}`}>
                        {t.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Event details form */}
              <div className="glass-card p-lg rounded-2xl space-y-md">
                <h3 className="font-display text-h3 text-on-surface">Event Details</h3>
                {[
                  { key: 'title', label: 'Event Title' },
                  { key: 'subtitle', label: 'Tagline / Subtitle' },
                  { key: 'date', label: 'Date' },
                  { key: 'time', label: 'Time' },
                  { key: 'venue', label: 'Venue' },
                  { key: 'host', label: 'Hosted By' },
                  { key: 'rsvpDate', label: 'RSVP By Date' },
                  { key: 'note', label: 'Additional Note' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-on-surface-variant text-sm font-label-md mb-xs">{f.label}</label>
                    <input
                      value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-md py-xs text-on-surface text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="sticky top-24">
              <h3 className="font-display text-h3 text-on-surface mb-md">Live Preview</h3>
              <motion.div
                className={`bg-gradient-to-br ${template.bg} rounded-3xl overflow-hidden shadow-2xl`}
                style={{ boxShadow: `0 30px 60px ${template.accent}20` }}
                animate={{ boxShadow: `0 30px 60px ${template.accent}20` }}
              >
                <div className="p-xl text-center">
                  {/* Decorative top */}
                  <div className="flex justify-center mb-lg">
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${template.accent}20`, border: `2px solid ${template.accent}40` }}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ color: template.accent, fontVariationSettings: "'FILL' 1", fontSize: 28 }}>celebration</span>
                    </motion.div>
                  </div>

                  <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-sm font-label-md">{form.subtitle}</p>
                  <h2 className="font-display text-2xl text-white mb-sm leading-tight">{form.title}</h2>

                  <div className="w-16 h-px mx-auto mb-lg" style={{ backgroundColor: `${template.accent}60` }} />

                  <div className="space-y-sm mb-lg">
                    {[
                      { icon: 'calendar_today', value: form.date },
                      { icon: 'schedule', value: form.time },
                      { icon: 'location_on', value: form.venue },
                      { icon: 'person', value: form.host },
                    ].map((d, i) => (
                      <div key={i} className="flex items-center justify-center gap-sm">
                        <span className="material-symbols-outlined text-sm" style={{ color: template.accent, fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                        <span className="text-white/80 text-sm">{d.value}</span>
                      </div>
                    ))}
                  </div>

                  {form.note && (
                    <div className="text-white/50 text-xs border-t pt-md" style={{ borderColor: `${template.accent}20` }}>
                      {form.note}
                    </div>
                  )}

                  <div className="mt-lg pt-md border-t" style={{ borderColor: `${template.accent}20` }}>
                    <div className="text-white/40 text-xs mb-sm">RSVP by {form.rsvpDate}</div>
                    <motion.div
                      className="inline-block px-lg py-sm rounded-xl text-sm font-label-md text-white"
                      style={{ backgroundColor: template.accent }}
                      whileHover={{ scale: 1.05 }}
                    >
                      RSVP Now →
                    </motion.div>
                  </div>

                  <p className="text-white/20 text-xs mt-lg">Powered by Eventra AI</p>
                </div>
              </motion.div>

              {/* Share link */}
              <AnimatePresence>
                {shared && (
                  <motion.div
                    className="mt-md glass-card p-md rounded-xl border border-secondary/20 bg-secondary/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-sm mb-sm">
                      <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="text-secondary font-label-md text-sm">Invite is live!</span>
                    </div>
                    <div className="flex items-center gap-sm">
                      <div className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-xs text-on-surface-variant text-xs font-mono truncate">
                        Eventra.ai/invite/sharma-wedding-2026
                      </div>
                      <motion.button className="px-sm py-xs bg-primary-container text-on-primary-container rounded-lg text-xs font-label-md" whileHover={{ scale: 1.05 }}>
                        Copy
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
