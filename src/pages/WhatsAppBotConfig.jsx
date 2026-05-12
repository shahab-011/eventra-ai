import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const TABS = ['Messages', 'Phone Preview', 'Triggers', 'Analytics'];

const defaultMessages = {
  welcome: 'Hi {{name}}! 👋 Welcome to the {{event}} gallery. Send a selfie to find your photos!',
  selfie_prompt: 'Great! Processing your selfie now... 🔍 We\'ll match your photos in under 30 seconds.',
  delivery: 'Your photos are ready! 🎉 We found {{count}} photos of you at {{event}}. Tap to view & download: {{link}}',
  fallback: 'Hmm, we couldn\'t find a match right now. Try a clearer selfie or contact the photographer.',
  follow_up: 'Loved your photos? Share this gallery with friends: {{link}} 📸',
};

const WHATSAPP_LOGS = [
  { time: '2 min ago', guest: 'Priya S.', type: 'selfie', msg: '[Photo sent]', status: 'matched' },
  { time: '5 min ago', guest: 'Raj K.', type: 'delivery', msg: 'Your photos are ready! 42 photos found.', status: 'delivered' },
  { time: '11 min ago', guest: 'Neha G.', type: 'fallback', msg: "Hmm, we couldn't find a match.", status: 'no_match' },
  { time: '18 min ago', guest: 'Arjun S.', type: 'delivery', msg: 'Your photos are ready! 28 photos found.', status: 'delivered' },
];

export default function WhatsAppBotConfig() {
  const [activeTab, setActiveTab] = useState('Messages');
  const [messages, setMessages] = useState(defaultMessages);
  const [botEnabled, setBotEnabled] = useState(true);
  const [previewStep, setPreviewStep] = useState(0);

  const previewMessages = [
    { side: 'right', text: 'Hi, I want my wedding photos!' },
    { side: 'left', text: `Hi Guest! 👋 Welcome to the Sharma Wedding gallery. Send a selfie to find your photos!` },
    { side: 'right', text: '[Selfie photo]' },
    { side: 'left', text: 'Great! Processing your selfie now... 🔍 We\'ll match your photos in under 30 seconds.' },
    { side: 'left', text: 'Your photos are ready! 🎉 We found 42 photos of you at Sharma Wedding. Tap to view & download: Eventra.ai/g/xyz123' },
    { side: 'right', text: 'OMG thank you so much! These are beautiful! 😍' },
  ];

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-md">
            <h1 className="font-display text-h2 text-on-surface">WhatsApp Bot Config</h1>
            <div className="flex items-center gap-xs">
              <div className={`w-2 h-2 rounded-full ${botEnabled ? 'bg-[#25D366] animate-pulse' : 'bg-outline'}`} />
              <span className={`text-sm font-label-md ${botEnabled ? 'text-[#25D366]' : 'text-on-surface-variant'}`}>
                {botEnabled ? 'Bot Active' : 'Bot Paused'}
              </span>
            </div>
          </div>
          <motion.button
            className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs border ${botEnabled ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/30'}`}
            onClick={() => setBotEnabled(b => !b)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {botEnabled ? 'pause_circle' : 'play_circle'}
            </span>
            {botEnabled ? 'Pause Bot' : 'Enable Bot'}
          </motion.button>
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
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="wa-tab" />}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-lg py-lg">
          <AnimatePresence mode="wait">
            {activeTab === 'Messages' && (
              <motion.div key="msgs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                  <div className="space-y-md">
                    {Object.entries(messages).map(([key, val]) => (
                      <motion.div key={key} className="glass-card p-md rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
                        <label className="block text-on-surface font-label-md text-sm mb-xs capitalize">
                          {key.replace(/_/g, ' ')} Message
                        </label>
                        <textarea
                          rows={3}
                          value={val}
                          onChange={e => setMessages(m => ({ ...m, [key]: e.target.value }))}
                          className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm placeholder-outline focus:border-primary outline-none resize-none transition-colors"
                        />
                        <div className="flex gap-xs mt-xs flex-wrap">
                          {['{{name}}', '{{event}}', '{{count}}', '{{link}}'].map(v => (
                            <motion.button
                              key={v}
                              className="text-xs bg-primary-container/15 text-primary px-xs py-xs rounded-lg font-mono"
                              onClick={() => setMessages(m => ({ ...m, [key]: m[key] + ' ' + v }))}
                              whileHover={{ scale: 1.05 }}
                            >
                              {v}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    <motion.button
                      className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Save Message Templates
                    </motion.button>
                  </div>

                  {/* Live activity log */}
                  <div className="glass-card p-lg rounded-2xl">
                    <div className="flex items-center gap-sm mb-md">
                      <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
                      <h3 className="font-display text-h3 text-on-surface">Live Activity</h3>
                    </div>
                    <div className="space-y-sm">
                      {WHATSAPP_LOGS.map((log, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-sm p-sm bg-surface-container rounded-xl"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                            {log.guest[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-on-surface text-xs font-label-md">{log.guest}</span>
                              <span className="text-on-surface-variant text-xs">{log.time}</span>
                            </div>
                            <p className="text-on-surface-variant text-xs mt-xs truncate">{log.msg}</p>
                          </div>
                          <span className={`text-xs px-xs py-xs rounded-full font-label-md flex-shrink-0 ${log.status === 'delivered' ? 'bg-[#25D366]/10 text-[#25D366]' : log.status === 'matched' ? 'bg-secondary/10 text-secondary' : 'bg-yellow-400/10 text-yellow-400'}`}>
                            {log.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Phone Preview' && (
              <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-center">
                <div className="w-full max-w-sm">
                  <div className="text-center mb-md">
                    <p className="text-on-surface-variant text-sm">Tap through to see the full bot conversation</p>
                  </div>
                  <div className="bg-[#111B21] rounded-3xl p-4 shadow-2xl">
                    <div className="bg-[#1F2C34] rounded-2xl overflow-hidden">
                      {/* WA header */}
                      <div className="bg-[#202C33] p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">Eventra Bot</div>
                          <div className="text-green-400 text-xs">online · Sharma Wedding</div>
                        </div>
                      </div>
                      {/* Messages */}
                      <div className="p-3 space-y-2 min-h-[300px] bg-[#0B141A]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}>
                        <AnimatePresence>
                          {previewMessages.slice(0, previewStep + 1).map((m, i) => (
                            <motion.div
                              key={i}
                              className={`flex ${m.side === 'right' ? 'justify-end' : 'justify-start'}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-xs text-white ${m.side === 'right' ? 'bg-[#005C4B]' : 'bg-[#202C33]'}`}>
                                {m.text}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="p-3 flex gap-2">
                        <motion.button
                          className="flex-1 bg-[#25D366] text-white rounded-xl py-2 text-sm font-bold"
                          onClick={() => setPreviewStep(s => Math.min(s + 1, previewMessages.length - 1))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={previewStep >= previewMessages.length - 1}
                        >
                          {previewStep >= previewMessages.length - 1 ? 'End of preview' : 'Next →'}
                        </motion.button>
                        {previewStep > 0 && (
                          <motion.button
                            className="px-3 bg-[#202C33] text-white rounded-xl py-2 text-sm"
                            onClick={() => setPreviewStep(0)}
                            whileHover={{ scale: 1.02 }}
                          >
                            Reset
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Triggers' && (
              <motion.div key="triggers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="max-w-xl space-y-md">
                  {[
                    { label: 'Send welcome on event join', desc: 'Automatically welcome guests when they join via RSVP link', enabled: true },
                    { label: 'Trigger on selfie received', desc: 'Start face matching as soon as a guest sends a selfie', enabled: true },
                    { label: 'Deliver immediately after match', desc: 'Send gallery link without waiting for manual approval', enabled: true },
                    { label: 'Follow-up after 24 hours', desc: 'Send a gentle reminder if guest hasn\'t downloaded yet', enabled: false },
                    { label: 'Post-event review request', desc: 'Ask for a Google review 48 hours after event ends', enabled: false },
                  ].map((t, i) => (
                    <motion.div
                      key={i}
                      className="glass-card p-md rounded-xl flex items-start gap-md"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.enabled ? 'bg-[#25D366]/15' : 'bg-surface-variant'}`}>
                        <span className={`material-symbols-outlined text-sm ${t.enabled ? 'text-[#25D366]' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {t.enabled ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-on-surface font-label-md text-sm">{t.label}</div>
                        <div className="text-on-surface-variant text-xs mt-xs">{t.desc}</div>
                      </div>
                      <motion.div
                        className={`w-10 h-5 rounded-full relative cursor-pointer flex-shrink-0 ${t.enabled ? 'bg-[#25D366]' : 'bg-surface-variant'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                          animate={{ left: t.enabled ? '22px' : '2px' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Analytics' && (
              <motion.div key="wa-analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
                  {[
                    { label: 'Messages Sent', value: '2,841', icon: 'send', color: 'text-primary' },
                    { label: 'Open Rate', value: '93%', icon: 'mark_email_read', color: 'text-secondary' },
                    { label: 'Click Rate', value: '78%', icon: 'touch_app', color: 'text-primary' },
                    { label: 'Downloads', value: '2,209', icon: 'download', color: 'text-secondary' },
                  ].map((s, i) => (
                    <motion.div key={i} className="glass-card p-md rounded-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                      <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                      <div className="font-display text-h2 text-on-surface">{s.value}</div>
                      <div className="text-on-surface-variant text-sm">{s.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="glass-card p-lg rounded-2xl">
                  <h3 className="font-display text-h3 text-on-surface mb-md">Message Funnel</h3>
                  <div className="space-y-sm">
                    {[
                      { label: 'Total Guests', value: 842, max: 842, color: 'bg-outline-variant' },
                      { label: 'Selfie Received', value: 776, max: 842, color: 'bg-primary-container' },
                      { label: 'Faces Matched', value: 731, max: 842, color: 'bg-secondary' },
                      { label: 'Gallery Link Sent', value: 731, max: 842, color: 'bg-[#25D366]' },
                      { label: 'Link Opened', value: 620, max: 842, color: 'bg-[#25D366]' },
                      { label: 'Photos Downloaded', value: 570, max: 842, color: 'bg-secondary' },
                    ].map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-xs">
                          <span className="text-on-surface-variant">{b.label}</span>
                          <span className="text-on-surface font-label-md">{b.value} <span className="text-on-surface-variant font-normal">({Math.round((b.value / b.max) * 100)}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${b.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(b.value / b.max) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppSidebar>
  );
}
