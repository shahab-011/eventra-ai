import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const CEREMONY_PRESETS = [
  { id: 'haldi', label: 'Haldi', icon: 'water_drop', color: 'from-yellow-500/20 to-amber-500/20', iconColor: 'text-yellow-400' },
  { id: 'mehendi', label: 'Mehendi', icon: 'spa', color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
  { id: 'sangeet', label: 'Sangeet', icon: 'music_note', color: 'from-pink-500/20 to-rose-500/20', iconColor: 'text-pink-400' },
  { id: 'wedding', label: 'Wedding', icon: 'favorite', color: 'from-primary-container/20 to-secondary-container/20', iconColor: 'text-primary' },
  { id: 'reception', label: 'Reception', icon: 'celebration', color: 'from-secondary-container/20 to-primary-container/20', iconColor: 'text-secondary' },
  { id: 'engagement', label: 'Engagement', icon: 'diamond', color: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-blue-400' },
  { id: 'roka', label: 'Roka', icon: 'handshake', color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400' },
  { id: 'custom', label: 'Custom', icon: 'add_circle', color: 'from-surface-variant/20 to-surface-container/20', iconColor: 'text-on-surface-variant' },
];

const INITIAL_SUBEVENTS = [
  { id: 1, ceremonyId: 'haldi', label: 'Haldi', date: 'May 17, 2026', time: '10:00 AM', venue: 'Garden Lawn, The Grand Ballroom', photos: 342, guests: 85, qrScans: 67, status: 'completed', guestAccess: 'all' },
  { id: 2, ceremonyId: 'mehendi', label: 'Mehendi', date: 'May 17, 2026', time: '4:00 PM', venue: 'Rooftop Terrace, The Grand Ballroom', photos: 218, guests: 120, qrScans: 91, status: 'completed', guestAccess: 'all' },
  { id: 3, ceremonyId: 'sangeet', label: 'Sangeet', date: 'May 17, 2026', time: '7:00 PM', venue: 'Ballroom Hall A', photos: 489, guests: 250, qrScans: 203, status: 'live', guestAccess: 'all' },
  { id: 4, ceremonyId: 'wedding', label: 'Wedding', date: 'May 18, 2026', time: '10:00 AM', venue: 'Main Mandap, The Grand Ballroom', photos: 0, guests: 350, qrScans: 0, status: 'upcoming', guestAccess: 'all' },
  { id: 5, ceremonyId: 'reception', label: 'Reception', date: 'May 18, 2026', time: '7:00 PM', venue: 'Crystal Hall, The Grand Ballroom', photos: 0, guests: 500, qrScans: 0, status: 'upcoming', guestAccess: 'vip' },
];

const statusConfig = {
  completed: { label: 'Completed', color: 'text-secondary bg-secondary/10 border-secondary/20' },
  live: { label: 'Live Now', color: 'text-green-400 bg-green-400/10 border-green-400/20', pulse: true },
  upcoming: { label: 'Upcoming', color: 'text-on-surface-variant bg-surface-variant/30 border-outline-variant/20' },
};

export default function SubEventManager() {
  const [subEvents, setSubEvents] = useState(INITIAL_SUBEVENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [newEvent, setNewEvent] = useState({ label: '', date: '', time: '', venue: '', guestAccess: 'all' });
  const [activeTab, setActiveTab] = useState('overview');

  const totalPhotos = subEvents.reduce((a, s) => a + s.photos, 0);
  const totalGuests = Math.max(...subEvents.map(s => s.guests));
  const liveCount = subEvents.filter(s => s.status === 'live').length;

  const addSubEvent = () => {
    if (!newEvent.label || !newEvent.date) return;
    setSubEvents(prev => [...prev, {
      id: Date.now(),
      ceremonyId: selectedPreset?.id || 'custom',
      label: newEvent.label,
      date: newEvent.date,
      time: newEvent.time,
      venue: newEvent.venue,
      photos: 0,
      guests: 0,
      qrScans: 0,
      status: 'upcoming',
      guestAccess: newEvent.guestAccess,
    }]);
    setShowAddModal(false);
    setNewEvent({ label: '', date: '', time: '', venue: '', guestAccess: 'all' });
    setSelectedPreset(null);
  };

  const deleteSubEvent = (id) => setSubEvents(prev => prev.filter(s => s.id !== id));

  const getCeremony = (id) => CEREMONY_PRESETS.find(c => c.id === id) || CEREMONY_PRESETS[7];

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <div>
            <h1 className="font-display text-h2 text-on-surface">Sub-Event Manager</h1>
            <p className="text-on-surface-variant text-xs">Sharma–Verma Wedding · May 17–18, 2026</p>
          </div>
          <motion.button
            className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
            onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Add Ceremony
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg space-y-lg">
          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Total Ceremonies', value: subEvents.length, icon: 'event', color: 'text-primary' },
              { label: 'Total Photos', value: totalPhotos.toLocaleString(), icon: 'photo_library', color: 'text-secondary' },
              { label: 'Peak Guest Count', value: totalGuests, icon: 'group', color: 'text-primary' },
              { label: 'Live Now', value: liveCount, icon: 'live_tv', color: liveCount > 0 ? 'text-green-400' : 'text-on-surface-variant' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3 }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tab bar */}
          <div className="flex gap-xs border-b border-outline-variant/10">
            {['overview', 'timeline', 'guest-access'].map(tab => (
              <motion.button
                key={tab}
                className={`py-sm px-md text-sm font-label-md capitalize relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.replace('-', ' ')}
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="se-tab" />}
              </motion.button>
            ))}
          </div>

          {/* Sub-event cards */}
          {activeTab === 'overview' && (
            <motion.div className="space-y-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
              {subEvents.map((se, i) => {
                const ceremony = getCeremony(se.ceremonyId);
                const sc = statusConfig[se.status];
                return (
                  <motion.div
                    key={se.id}
                    variants={fadeInUp}
                    className="glass-card rounded-2xl overflow-hidden"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-stretch">
                      {/* Color bar */}
                      <div className={`w-1.5 bg-gradient-to-b ${ceremony.color} flex-shrink-0`} />
                      <div className="flex-1 p-lg">
                        <div className="flex items-start justify-between gap-md">
                          <div className="flex items-center gap-md">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ceremony.color} flex items-center justify-center flex-shrink-0`}>
                              <span className={`material-symbols-outlined text-h2 ${ceremony.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{ceremony.icon}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-sm">
                                <h3 className="font-display text-h3 text-on-surface">{se.label}</h3>
                                <span className={`text-xs font-label-md px-sm py-0.5 rounded-full border ${sc.color} flex items-center gap-xs`}>
                                  {sc.pulse && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />}
                                  {sc.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-md text-on-surface-variant text-sm mt-xs">
                                <span className="flex items-center gap-xs">
                                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                                  {se.date}
                                </span>
                                <span className="flex items-center gap-xs">
                                  <span className="material-symbols-outlined text-sm">schedule</span>
                                  {se.time}
                                </span>
                              </div>
                              <div className="text-on-surface-variant text-xs mt-xs flex items-center gap-xs">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {se.venue}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-sm flex-shrink-0">
                            <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-primary" whileHover={{ scale: 1.05 }} title="View QR Code">
                              <span className="material-symbols-outlined text-sm">qr_code</span>
                            </motion.button>
                            <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-primary" whileHover={{ scale: 1.05 }} title="Edit">
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </motion.button>
                            <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-red-400" whileHover={{ scale: 1.05 }} onClick={() => deleteSubEvent(se.id)} title="Delete">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-md mt-md pt-md border-t border-outline-variant/10">
                          {[
                            { icon: 'photo_library', label: 'Photos', value: se.photos.toLocaleString(), color: 'text-primary' },
                            { icon: 'group', label: 'Guests', value: se.guests, color: 'text-secondary' },
                            { icon: 'qr_code_scanner', label: 'QR Scans', value: se.qrScans, color: 'text-on-surface-variant' },
                          ].map((stat, j) => (
                            <div key={j} className="text-center">
                              <span className={`material-symbols-outlined text-sm ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                              <div className="font-display text-h3 text-on-surface">{stat.value}</div>
                              <div className="text-on-surface-variant text-xs">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Guest access */}
                        <div className="flex items-center gap-sm mt-md">
                          <span className="text-on-surface-variant text-xs">Guest Access:</span>
                          <span className={`text-xs font-label-md px-sm py-0.5 rounded-full ${se.guestAccess === 'all' ? 'bg-secondary/10 text-secondary' : 'bg-primary-container/15 text-primary'}`}>
                            {se.guestAccess === 'all' ? 'All Guests' : 'VIP Only'}
                          </span>
                          <button className="text-xs text-primary ml-auto">Change →</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <div className="relative max-w-2xl">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary-container via-secondary-container to-transparent" />
              <div className="space-y-lg pl-20">
                {subEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map((se, i) => {
                  const ceremony = getCeremony(se.ceremonyId);
                  return (
                    <motion.div key={se.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative">
                      <div className={`absolute -left-12 w-8 h-8 rounded-full bg-gradient-to-br ${ceremony.color} flex items-center justify-center shadow-lg border border-outline-variant/20`}>
                        <span className={`material-symbols-outlined text-sm ${ceremony.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{ceremony.icon}</span>
                      </div>
                      <div className="glass-card p-md rounded-2xl">
                        <div className="flex items-center justify-between mb-xs">
                          <h3 className="font-display text-h3 text-on-surface">{se.label}</h3>
                          <span className={`text-xs font-label-md px-sm py-0.5 rounded-full border ${statusConfig[se.status].color}`}>{statusConfig[se.status].label}</span>
                        </div>
                        <div className="text-on-surface-variant text-sm">{se.date} · {se.time}</div>
                        <div className="text-on-surface-variant text-xs mt-xs">{se.venue}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'guest-access' && (
            <div className="glass-card p-lg rounded-2xl">
              <h3 className="font-display text-h3 text-on-surface mb-md">Guest Access Control</h3>
              <p className="text-on-surface-variant text-sm mb-lg">Control which guests can view each ceremony's gallery. Changes apply immediately.</p>
              <div className="space-y-sm">
                {subEvents.map((se) => {
                  const ceremony = getCeremony(se.ceremonyId);
                  return (
                    <div key={se.id} className="flex items-center justify-between p-md bg-surface-container rounded-xl">
                      <div className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined text-sm ${ceremony.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{ceremony.icon}</span>
                        <span className="text-on-surface font-label-md text-sm">{se.label}</span>
                        <span className="text-on-surface-variant text-xs">· {se.date}</span>
                      </div>
                      <div className="flex gap-sm">
                        {['all', 'vip', 'private'].map(opt => (
                          <motion.button
                            key={opt}
                            className={`px-sm py-xs rounded-lg text-xs font-label-md capitalize ${se.guestAccess === opt ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                            onClick={() => setSubEvents(prev => prev.map(s => s.id === se.id ? { ...s, guestAccess: opt } : s))}
                            whileHover={{ scale: 1.05 }}
                          >
                            {opt === 'all' ? 'All Guests' : opt === 'vip' ? 'VIP Only' : 'Private'}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Sub-Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <motion.div className="bg-surface-container rounded-3xl p-xl w-full max-w-lg shadow-2xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h2 className="font-display text-h2 text-on-surface mb-lg">Add Ceremony</h2>

              {/* Presets */}
              <div className="mb-lg">
                <label className="text-on-surface-variant text-sm font-label-md mb-sm block">Ceremony Type</label>
                <div className="grid grid-cols-4 gap-sm">
                  {CEREMONY_PRESETS.map(p => (
                    <motion.button
                      key={p.id}
                      className={`rounded-xl p-sm flex flex-col items-center gap-xs border ${selectedPreset?.id === p.id ? 'border-primary-container bg-primary-container/15' : 'border-outline-variant/20 bg-surface-container'}`}
                      onClick={() => { setSelectedPreset(p); setNewEvent(e => ({ ...e, label: p.id === 'custom' ? '' : p.label })); }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    >
                      <span className={`material-symbols-outlined text-h3 ${p.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                      <span className="text-xs font-label-md text-on-surface">{p.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-sm">
                {[
                  { key: 'label', label: 'Ceremony Name', placeholder: 'e.g. Haldi Ceremony' },
                  { key: 'date', label: 'Date', placeholder: 'May 18, 2026' },
                  { key: 'time', label: 'Time', placeholder: '10:00 AM' },
                  { key: 'venue', label: 'Venue', placeholder: 'Grand Ballroom, Mumbai' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-on-surface-variant text-sm font-label-md mb-xs block">{f.label}</label>
                    <input
                      value={newEvent[f.key]}
                      onChange={e => setNewEvent(n => ({ ...n, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-surface-variant border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-xs block">Guest Access</label>
                  <div className="flex gap-sm">
                    {['all', 'vip', 'private'].map(opt => (
                      <motion.button
                        key={opt}
                        className={`flex-1 py-sm rounded-xl text-sm font-label-md capitalize ${newEvent.guestAccess === opt ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                        onClick={() => setNewEvent(n => ({ ...n, guestAccess: opt }))}
                        whileHover={{ scale: 1.02 }}
                      >
                        {opt === 'all' ? 'All Guests' : opt === 'vip' ? 'VIP Only' : 'Private'}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-sm mt-lg">
                <motion.button className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25" onClick={addSubEvent} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Add Ceremony</motion.button>
                <motion.button className="px-lg py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => setShowAddModal(false)} whileHover={{ scale: 1.02 }}>Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppSidebar>
  );
}
