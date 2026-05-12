import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer, viewport } from '../utils/animations';

const TABS = ['Overview', 'Media', 'Guests', 'WhatsApp', 'Itinerary', 'Settings'];

const events = [
  { id: 1, name: 'Sharma Wedding', date: 'May 18, 2026', type: 'Wedding', status: 'active', guests: 842, media: 3240, matched: 768, delivered: 721, storage: '16.4 GB' },
  { id: 2, name: 'TechCorp Annual Meet', date: 'May 25, 2026', type: 'Corporate', status: 'upcoming', guests: 320, media: 0, matched: 0, delivered: 0, storage: '0 GB' },
  { id: 3, name: 'IIT Bombay Convocation', date: 'May 12, 2026', type: 'College', status: 'completed', guests: 1540, media: 7800, matched: 1480, delivered: 1410, storage: '41.2 GB' },
  { id: 4, name: 'Gupta Birthday Bash', date: 'Jun 2, 2026', type: 'Birthday', status: 'draft', guests: 120, media: 0, matched: 0, delivered: 0, storage: '0 GB' },
];

const mockPhotos = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, matched: i % 3 !== 0 }));
const mockGuests = [
  { name: 'Priya Sharma', phone: '+91 98765 43210', selfie: true, rsvp: 'confirmed', delivered: true },
  { name: 'Raj Kapoor', phone: '+91 87654 32109', selfie: true, rsvp: 'confirmed', delivered: true },
  { name: 'Neha Gupta', phone: '+91 76543 21098', selfie: false, rsvp: 'confirmed', delivered: false },
  { name: 'Arjun Singh', phone: '+91 65432 10987', selfie: true, rsvp: 'maybe', delivered: true },
  { name: 'Pooja Mehta', phone: '+91 54321 09876', selfie: false, rsvp: 'declined', delivered: false },
];

const statusColors = {
  active: 'bg-secondary/15 text-secondary border-secondary/20',
  upcoming: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-surface-variant text-on-surface-variant border-outline-variant/30',
  draft: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
};

export default function EventHub() {
  const [selectedEvent, setSelectedEvent] = useState(events[0]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showEventList, setShowEventList] = useState(false);

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-md">
            <Link to="/dashboard">
              <motion.button className="w-9 h-9 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_back</span>
              </motion.button>
            </Link>
            <motion.button
              className="flex items-center gap-sm glass-card border border-outline-variant/20 px-md py-xs rounded-xl"
              onClick={() => setShowEventList(!showEventList)}
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <div className="font-display text-base text-on-surface text-left">{selectedEvent.name}</div>
                <div className="text-on-surface-variant text-xs text-left">{selectedEvent.date} · {selectedEvent.type}</div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">{showEventList ? 'expand_less' : 'expand_more'}</span>
            </motion.button>
            <span className={`text-xs px-sm py-xs rounded-full border font-label-md ${statusColors[selectedEvent.status]}`}>
              {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <motion.button className="px-md py-xs bg-surface-container border border-outline-variant/20 rounded-xl text-on-surface-variant text-sm font-label-md flex items-center gap-xs" whileHover={{ scale: 1.02 }}>
              <span className="material-symbols-outlined text-sm">share</span> Share
            </motion.button>
            <Link to="/createevent">
              <motion.button className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <span className="material-symbols-outlined text-sm">add</span> New Event
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Event switcher dropdown */}
        <AnimatePresence>
          {showEventList && (
            <motion.div
              className="absolute top-16 left-32 z-40 w-80 glass-card border border-outline-variant/20 rounded-2xl p-sm shadow-2xl"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
            >
              {events.map((ev) => (
                <motion.div
                  key={ev.id}
                  className={`flex items-center gap-sm p-sm rounded-xl cursor-pointer ${selectedEvent.id === ev.id ? 'bg-primary-container/10' : 'hover:bg-surface-container'}`}
                  onClick={() => { setSelectedEvent(ev); setShowEventList(false); setActiveTab('Overview'); }}
                  whileHover={{ x: 3 }}
                >
                  <div className="flex-1">
                    <div className="text-on-surface text-sm font-label-md">{ev.name}</div>
                    <div className="text-on-surface-variant text-xs">{ev.date}</div>
                  </div>
                  <span className={`text-xs px-sm py-xs rounded-full border font-label-md ${statusColors[ev.status]}`}>
                    {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="border-b border-outline-variant/10 px-lg bg-background/60 backdrop-blur-xl">
          <div className="flex gap-xs overflow-x-auto">
            {TABS.map((tab) => (
              <motion.button
                key={tab}
                className={`py-sm px-md text-sm font-label-md whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="tab-indicator" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 px-lg py-lg">
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-lg">
                {/* Metric row */}
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
                  {[
                    { label: 'Total Guests', value: selectedEvent.guests.toLocaleString(), icon: 'group', color: 'text-primary' },
                    { label: 'Media Files', value: selectedEvent.media.toLocaleString(), icon: 'photo_library', color: 'text-secondary' },
                    { label: 'AI Matched', value: selectedEvent.matched.toLocaleString(), icon: 'face_6', color: 'text-primary' },
                    { label: 'Delivered', value: selectedEvent.delivered.toLocaleString(), icon: 'chat', color: 'text-[#25D366]' },
                  ].map((m, i) => (
                    <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                      <span className={`material-symbols-outlined text-h2 mb-xs block ${m.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                      <div className="font-display text-h2 text-on-surface">{m.value}</div>
                      <div className="text-on-surface-variant text-sm">{m.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Delivery funnel */}
                <motion.div className="glass-card p-lg rounded-2xl" variants={fadeInUp} initial="hidden" animate="visible">
                  <h3 className="font-display text-h3 text-on-surface mb-md">Delivery Pipeline</h3>
                  <div className="space-y-sm">
                    {[
                      { label: 'Photos Uploaded', value: selectedEvent.media, max: selectedEvent.media || 1, color: 'bg-secondary' },
                      { label: 'AI Matched', value: selectedEvent.matched, max: selectedEvent.media || 1, color: 'bg-primary-container' },
                      { label: 'WhatsApp Delivered', value: selectedEvent.delivered, max: selectedEvent.media || 1, color: 'bg-[#25D366]' },
                    ].map((bar, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-xs">
                          <span className="text-on-surface-variant">{bar.label}</span>
                          <span className="text-on-surface font-label-md">{bar.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${bar.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(bar.value / bar.max) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Quick actions */}
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-sm" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
                  {[
                    { icon: 'cloud_upload', label: 'Upload Photos', color: 'text-secondary', tab: 'Media' },
                    { icon: 'face_6', label: 'Run AI Match', color: 'text-primary', tab: 'Media' },
                    { icon: 'chat', label: 'Send via WhatsApp', color: 'text-[#25D366]', tab: 'WhatsApp' },
                    { icon: 'group', label: 'Manage Guests', color: 'text-primary', tab: 'Guests' },
                  ].map((a, i) => (
                    <motion.button
                      key={i}
                      variants={fadeInUp}
                      className="glass-card p-md rounded-xl flex flex-col items-center gap-sm border border-outline-variant/20"
                      onClick={() => setActiveTab(a.tab)}
                      whileHover={{ scale: 1.04, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className={`material-symbols-outlined text-h2 ${a.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                      <span className="text-on-surface text-xs font-label-md text-center">{a.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'Media' && (
              <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-md">
                  <h2 className="font-display text-h2 text-on-surface">{selectedEvent.media.toLocaleString()} Files</h2>
                  <div className="flex items-center gap-sm">
                    <motion.button className="px-md py-xs bg-secondary/15 text-secondary rounded-xl text-sm font-label-md flex items-center gap-xs border border-secondary/20" whileHover={{ scale: 1.03 }}>
                      <span className="material-symbols-outlined text-sm">face_6</span> Run AI Match
                    </motion.button>
                    <Link to="/medialibrary">
                      <motion.button className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <span className="material-symbols-outlined text-sm">cloud_upload</span> Upload
                      </motion.button>
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-sm">
                  {mockPhotos.map((p) => (
                    <motion.div
                      key={p.id}
                      className="relative rounded-xl overflow-hidden bg-surface-container aspect-square group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-h1 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                      </div>
                      {p.matched && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-background text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-xs">
                        <motion.button className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                          <span className="material-symbols-outlined text-white text-xs">open_in_new</span>
                        </motion.button>
                        <motion.button className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                          <span className="material-symbols-outlined text-white text-xs">download</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Guests' && (
              <motion.div key="guests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-md">
                  <h2 className="font-display text-h2 text-on-surface">{selectedEvent.guests} Guests</h2>
                  <motion.button className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs" whileHover={{ scale: 1.02 }}>
                    <span className="material-symbols-outlined text-sm">person_add</span> Add Guest
                  </motion.button>
                </div>
                <div className="glass-card rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        {['Guest', 'Phone', 'RSVP', 'Selfie', 'Delivered'].map((h) => (
                          <th key={h} className="text-left px-md py-sm text-on-surface-variant font-label-md text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockGuests.map((g, i) => (
                        <motion.tr
                          key={i}
                          className="border-b border-outline-variant/5 last:border-0 hover:bg-surface-container/50 transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <td className="px-md py-sm">
                            <div className="flex items-center gap-sm">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                                {g.name[0]}
                              </div>
                              <span className="text-on-surface font-label-md">{g.name}</span>
                            </div>
                          </td>
                          <td className="px-md py-sm text-on-surface-variant">{g.phone}</td>
                          <td className="px-md py-sm">
                            <span className={`text-xs px-sm py-xs rounded-full border font-label-md ${g.rsvp === 'confirmed' ? 'bg-secondary/10 text-secondary border-secondary/20' : g.rsvp === 'maybe' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-error/10 text-error border-error/20'}`}>
                              {g.rsvp.charAt(0).toUpperCase() + g.rsvp.slice(1)}
                            </span>
                          </td>
                          <td className="px-md py-sm">
                            <span className={`material-symbols-outlined text-sm ${g.selfie ? 'text-secondary' : 'text-outline'}`} style={{ fontVariationSettings: `'FILL' ${g.selfie ? 1 : 0}` }}>
                              {g.selfie ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </td>
                          <td className="px-md py-sm">
                            <span className={`material-symbols-outlined text-sm ${g.delivered ? 'text-[#25D366]' : 'text-outline'}`} style={{ fontVariationSettings: `'FILL' ${g.delivered ? 1 : 0}` }}>
                              {g.delivered ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'WhatsApp' && (
              <motion.div key="whatsapp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                  <div className="space-y-md">
                    <div className="glass-card p-lg rounded-2xl">
                      <h3 className="font-display text-h3 text-on-surface mb-md">Delivery Status</h3>
                      <div className="space-y-sm">
                        {[
                          { label: 'Total Guests', value: selectedEvent.guests, color: 'bg-outline-variant' },
                          { label: 'Selfie Submitted', value: Math.round(selectedEvent.guests * 0.9), color: 'bg-primary-container' },
                          { label: 'Photos Matched', value: selectedEvent.matched, color: 'bg-secondary' },
                          { label: 'Delivered via WhatsApp', value: selectedEvent.delivered, color: 'bg-[#25D366]' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-sm">
                              <div className={`w-2 h-2 rounded-full ${s.color}`} />
                              <span className="text-on-surface-variant text-sm">{s.label}</span>
                            </div>
                            <span className="text-on-surface font-label-md text-sm">{s.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <motion.button
                        className="w-full mt-md bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 py-sm rounded-xl font-label-md text-sm flex items-center justify-center gap-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                        Send Remaining Deliveries
                      </motion.button>
                    </div>
                    <div className="glass-card p-lg rounded-2xl">
                      <h3 className="font-display text-h3 text-on-surface mb-md">Message Template</h3>
                      <div className="bg-surface-container rounded-xl p-md text-sm text-on-surface-variant font-mono leading-relaxed">
                        Hi {'{guest_name}'} 👋<br /><br />
                        Your photos from <strong className="text-on-surface">{selectedEvent.name}</strong> are ready!<br /><br />
                        View & download: {'{gallery_link}'}<br /><br />
                        — Powered by Eventra AI 📸
                      </div>
                      <Link to="/whatsappbotconfig">
                        <motion.button className="w-full mt-sm text-primary font-label-md text-sm" whileHover={{ x: 3 }}>
                          Customize template in Bot Config →
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                  {/* WhatsApp preview */}
                  <div className="flex justify-center">
                    <div className="w-64 bg-[#111B21] rounded-3xl p-3 shadow-2xl">
                      <div className="bg-[#1F2C34] rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                          </div>
                          <div>
                            <div className="text-white text-xs font-bold">Eventra Bot</div>
                            <div className="text-green-400 text-xs">online</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-[#005C4B] rounded-lg p-2 text-xs text-white max-w-[80%]">
                            Hi Priya! 👋 Your photos from Sharma Wedding are ready!
                          </div>
                          <div className="bg-[#005C4B] rounded-lg p-2 text-xs text-white max-w-[80%]">
                            🎉 42 photos matched to you. Tap to view & download.
                          </div>
                          <div className="bg-[#202C33] rounded-lg p-2 text-xs text-[#8696A0]">
                            <span className="text-white">Priya:</span> Thank you so much!! 😍
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Itinerary' && (
              <motion.div key="itinerary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-md">
                  <h2 className="font-display text-h2 text-on-surface">Event Schedule</h2>
                  <motion.button className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs" whileHover={{ scale: 1.02 }}>
                    <span className="material-symbols-outlined text-sm">add</span> Add Function
                  </motion.button>
                </div>
                <div className="space-y-md">
                  {[
                    { name: 'Mehndi Ceremony', date: 'May 16, 2026', time: '4:00 PM', guests: 200, venue: 'Garden Lawn' },
                    { name: 'Sangeet Night', date: 'May 17, 2026', time: '7:00 PM', guests: 400, venue: 'Grand Ballroom' },
                    { name: 'Wedding Ceremony', date: 'May 18, 2026', time: '10:00 AM', guests: 842, venue: 'Main Hall' },
                    { name: 'Reception', date: 'May 18, 2026', time: '7:00 PM', guests: 600, venue: 'Grand Ballroom' },
                  ].map((fn, i) => (
                    <motion.div
                      key={i}
                      className="glass-card p-md rounded-xl flex items-center gap-md"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    >
                      <div className="w-12 h-12 bg-primary-container/15 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-base text-on-surface">{fn.name}</div>
                        <div className="text-on-surface-variant text-xs mt-xs flex items-center gap-md">
                          <span>{fn.date} · {fn.time}</span>
                          <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-xs">group</span>{fn.guests} guests</span>
                          <span className="flex items-center gap-xs"><span className="material-symbols-outlined text-xs">location_on</span>{fn.venue}</span>
                        </div>
                      </div>
                      <motion.button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">more_vert</span>
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="max-w-xl space-y-md">
                  {[
                    { label: 'Event Name', value: selectedEvent.name, type: 'text' },
                    { label: 'Date', value: selectedEvent.date, type: 'text' },
                    { label: 'Type', value: selectedEvent.type, type: 'text' },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">{f.label}</label>
                      <input
                        defaultValue={f.value}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none transition-colors"
                      />
                    </div>
                  ))}
                  <div className="flex gap-sm pt-md">
                    <motion.button className="px-xl py-sm bg-primary-container text-on-primary-container rounded-xl font-label-md text-sm shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Save Changes
                    </motion.button>
                    <motion.button className="px-xl py-sm border border-error/30 text-error rounded-xl font-label-md text-sm" whileHover={{ scale: 1.02, backgroundColor: 'rgba(239,68,68,0.08)' }} whileTap={{ scale: 0.98 }}>
                      Delete Event
                    </motion.button>
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
