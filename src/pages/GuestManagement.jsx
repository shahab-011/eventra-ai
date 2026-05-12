import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const GUESTS = [
  { id: 1, name: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya@example.com', event: 'Sharma Wedding', rsvp: 'confirmed', selfie: true, matched: 42, delivered: true, checkedIn: true },
  { id: 2, name: 'Raj Kapoor', phone: '+91 87654 32109', email: 'raj@example.com', event: 'Sharma Wedding', rsvp: 'confirmed', selfie: true, matched: 28, delivered: true, checkedIn: true },
  { id: 3, name: 'Neha Gupta', phone: '+91 76543 21098', email: 'neha@example.com', event: 'Sharma Wedding', rsvp: 'confirmed', selfie: false, matched: 0, delivered: false, checkedIn: false },
  { id: 4, name: 'Arjun Singh', phone: '+91 65432 10987', email: 'arjun@example.com', event: 'TechCorp Meet', rsvp: 'maybe', selfie: true, matched: 15, delivered: true, checkedIn: false },
  { id: 5, name: 'Pooja Mehta', phone: '+91 54321 09876', email: 'pooja@example.com', event: 'Sharma Wedding', rsvp: 'declined', selfie: false, matched: 0, delivered: false, checkedIn: false },
  { id: 6, name: 'Vikram Nair', phone: '+91 43210 98765', email: 'vikram@example.com', event: 'TechCorp Meet', rsvp: 'confirmed', selfie: true, matched: 33, delivered: true, checkedIn: true },
  { id: 7, name: 'Sanya Joshi', phone: '+91 32109 87654', email: 'sanya@example.com', event: 'IIT Convocation', rsvp: 'confirmed', selfie: true, matched: 21, delivered: true, checkedIn: true },
  { id: 8, name: 'Kabir Malhotra', phone: '+91 21098 76543', email: 'kabir@example.com', event: 'IIT Convocation', rsvp: 'confirmed', selfie: false, matched: 0, delivered: false, checkedIn: false },
];

const rsvpColors = {
  confirmed: 'bg-secondary/10 text-secondary border-secondary/20',
  maybe: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  declined: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const FILTERS = ['All Guests', 'Selfie Missing', 'Not Delivered', 'Confirmed', 'Declined'];

export default function GuestManagement() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Guests');
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '', event: 'Sharma Wedding' });

  const filtered = GUESTS.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) || g.event.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'Selfie Missing') return !g.selfie;
    if (filter === 'Not Delivered') return !g.delivered;
    if (filter === 'Confirmed') return g.rsvp === 'confirmed';
    if (filter === 'Declined') return g.rsvp === 'declined';
    return true;
  });

  const toggleSelect = (id) => setSelectedGuests(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelectedGuests(selectedGuests.length === filtered.length ? [] : filtered.map(g => g.id));

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Guest Management</h1>
          <motion.button
            className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
            onClick={() => setShowAdd(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm">person_add</span> Add Guest
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg">
          {/* Stats row */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg"
            variants={staggerContainer(0.07)}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: 'Total Guests', value: GUESTS.length, icon: 'group', color: 'text-primary' },
              { label: 'Selfie Submitted', value: GUESTS.filter(g => g.selfie).length, icon: 'face_6', color: 'text-secondary' },
              { label: 'Photos Delivered', value: GUESTS.filter(g => g.delivered).length, icon: 'chat', color: 'text-[#25D366]' },
              { label: 'Checked In', value: GUESTS.filter(g => g.checkedIn).length, icon: 'check_circle', color: 'text-secondary' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-sm mb-md">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                placeholder="Search guests, phone, event..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-10 pr-md py-xs text-on-surface placeholder-outline text-sm focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="flex gap-xs flex-wrap">
              {FILTERS.map((f) => (
                <motion.button
                  key={f}
                  className={`px-sm py-xs rounded-xl text-xs font-label-md border transition-all ${filter === f ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:border-outline-variant/40'}`}
                  onClick={() => setFilter(f)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          <AnimatePresence>
            {selectedGuests.length > 0 && (
              <motion.div
                className="mb-md p-sm bg-primary-container/10 border border-primary-container/20 rounded-xl flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="text-primary font-label-md text-sm">{selectedGuests.length} guest{selectedGuests.length > 1 ? 's' : ''} selected</span>
                <div className="flex gap-sm">
                  <motion.button className="px-sm py-xs bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 rounded-lg text-xs font-label-md flex items-center gap-xs" whileHover={{ scale: 1.03 }}>
                    <span className="material-symbols-outlined text-xs">chat</span> Send WhatsApp
                  </motion.button>
                  <motion.button className="px-sm py-xs bg-surface-container border border-outline-variant/20 text-on-surface rounded-lg text-xs font-label-md flex items-center gap-xs" whileHover={{ scale: 1.03 }}>
                    <span className="material-symbols-outlined text-xs">download</span> Export
                  </motion.button>
                  <motion.button className="px-sm py-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-label-md flex items-center gap-xs" whileHover={{ scale: 1.03 }}>
                    <span className="material-symbols-outlined text-xs">delete</span> Remove
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <motion.div
            className="glass-card rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="px-md py-sm text-left">
                      <motion.input
                        type="checkbox"
                        checked={selectedGuests.length === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="accent-primary w-4 h-4 rounded cursor-pointer"
                      />
                    </th>
                    {['Guest', 'Event', 'RSVP', 'Selfie', 'Matched', 'Delivered', 'Check-in', ''].map((h) => (
                      <th key={h} className="text-left px-md py-sm text-on-surface-variant font-label-md text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((g, i) => (
                      <motion.tr
                        key={g.id}
                        className={`border-b border-outline-variant/5 last:border-0 transition-colors ${selectedGuests.includes(g.id) ? 'bg-primary-container/5' : 'hover:bg-surface-container/40'}`}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <td className="px-md py-sm">
                          <input
                            type="checkbox"
                            checked={selectedGuests.includes(g.id)}
                            onChange={() => toggleSelect(g.id)}
                            className="accent-primary w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-md py-sm">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                              {g.name[0]}
                            </div>
                            <div>
                              <div className="text-on-surface font-label-md text-xs">{g.name}</div>
                              <div className="text-on-surface-variant text-xs">{g.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-md py-sm text-on-surface-variant text-xs whitespace-nowrap">{g.event}</td>
                        <td className="px-md py-sm">
                          <span className={`text-xs px-sm py-xs rounded-full border font-label-md ${rsvpColors[g.rsvp]}`}>
                            {g.rsvp.charAt(0).toUpperCase() + g.rsvp.slice(1)}
                          </span>
                        </td>
                        <td className="px-md py-sm text-center">
                          <span className={`material-symbols-outlined text-sm ${g.selfie ? 'text-secondary' : 'text-outline'}`} style={{ fontVariationSettings: `'FILL' ${g.selfie ? 1 : 0}` }}>
                            {g.selfie ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </td>
                        <td className="px-md py-sm text-center">
                          <span className={`font-label-md text-sm ${g.matched > 0 ? 'text-primary' : 'text-outline'}`}>
                            {g.matched > 0 ? g.matched : '—'}
                          </span>
                        </td>
                        <td className="px-md py-sm text-center">
                          <span className={`material-symbols-outlined text-sm ${g.delivered ? 'text-[#25D366]' : 'text-outline'}`} style={{ fontVariationSettings: `'FILL' ${g.delivered ? 1 : 0}` }}>
                            {g.delivered ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </td>
                        <td className="px-md py-sm text-center">
                          <span className={`material-symbols-outlined text-sm ${g.checkedIn ? 'text-secondary' : 'text-outline'}`} style={{ fontVariationSettings: `'FILL' ${g.checkedIn ? 1 : 0}` }}>
                            {g.checkedIn ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </td>
                        <td className="px-md py-sm">
                          <motion.button className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                            <span className="material-symbols-outlined text-on-surface-variant text-xs">more_vert</span>
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="px-md py-sm border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Showing {filtered.length} of {GUESTS.length} guests</span>
              <div className="flex gap-xs">
                <motion.button className="px-sm py-xs bg-surface-container rounded-lg" whileHover={{ scale: 1.05 }}>← Prev</motion.button>
                <motion.button className="px-sm py-xs bg-surface-container rounded-lg" whileHover={{ scale: 1.05 }}>Next →</motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add guest modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-gutter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
            >
              <motion.div
                className="glass-card p-lg rounded-2xl w-full max-w-md space-y-md"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-h2 text-on-surface">Add Guest</h2>
                  <motion.button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center" onClick={() => setShowAdd(false)} whileHover={{ scale: 1.1 }}>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
                  </motion.button>
                </div>
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Priya Sharma', type: 'text' },
                  { key: 'phone', label: 'Phone (WhatsApp)', placeholder: '+91 98765 43210', type: 'tel' },
                  { key: 'email', label: 'Email (optional)', placeholder: 'priya@example.com', type: 'email' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-on-surface-variant text-sm font-label-md mb-xs">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={newGuest[f.key]}
                      onChange={e => setNewGuest(g => ({ ...g, [f.key]: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface placeholder-outline focus:border-primary outline-none transition-colors text-sm"
                    />
                  </div>
                ))}
                <div className="flex gap-sm pt-sm">
                  <motion.button
                    className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25"
                    onClick={() => setShowAdd(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Add Guest
                  </motion.button>
                  <motion.button className="px-lg py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => setShowAdd(false)} whileHover={{ scale: 1.02 }}>
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppSidebar>
  );
}
