import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const EVENTS = [
  { id: 1, name: 'Sharma–Verma Wedding', date: 'May 2026', photos: 4049, videos: 12, storage: 18.4, totalGB: 50, status: 'active', client: 'Priya Sharma', transferable: false },
  { id: 2, name: 'Kapoor Anniversary', date: 'Apr 2026', photos: 1240, videos: 4, storage: 6.2, totalGB: 25, status: 'active', client: 'Rahul Kapoor', transferable: true },
  { id: 3, name: 'Gupta Corporate Summit', date: 'Mar 2026', photos: 872, videos: 2, storage: 4.1, totalGB: 25, status: 'delivered', client: 'Meera Gupta', transferable: true },
  { id: 4, name: 'Singh Engagement', date: 'Feb 2026', photos: 634, videos: 1, storage: 2.9, totalGB: 10, status: 'delivered', client: 'Amit Singh', transferable: true },
  { id: 5, name: 'Mehta Reception', date: 'Jan 2026', photos: 1891, videos: 7, storage: 9.8, totalGB: 25, status: 'archived', client: 'Neha Mehta', transferable: false },
];

const statusConfig = {
  active: { label: 'Active', color: 'text-secondary bg-secondary/10 border-secondary/20' },
  delivered: { label: 'Delivered', color: 'text-primary bg-primary-container/15 border-primary-container/30' },
  archived: { label: 'Archived', color: 'text-on-surface-variant bg-surface-variant/30 border-outline-variant/20' },
};

export default function StorageManager() {
  const [events, setEvents] = useState(EVENTS);
  const [transferModal, setTransferModal] = useState(null);
  const [transferStep, setTransferStep] = useState(1);
  const [transferEmail, setTransferEmail] = useState('');
  const [expandedEvent, setExpandedEvent] = useState(null);

  const usedGB = events.filter(e => e.status !== 'archived').reduce((a, e) => a + e.storage, 0);
  const totalPlanGB = 200;
  const usedPercent = (usedGB / totalPlanGB) * 100;

  const handleTransfer = () => {
    if (transferStep === 1) { setTransferStep(2); return; }
    setEvents(prev => prev.map(e => e.id === transferModal.id ? { ...e, status: 'archived', storage: 0 } : e));
    setTransferModal(null);
    setTransferStep(1);
    setTransferEmail('');
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Storage Manager</h1>
          <motion.button
            className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm">upgrade</span> Upgrade Plan
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg space-y-lg">
          {/* Overall storage */}
          <motion.div className="glass-card p-lg rounded-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-md">
              <div>
                <h3 className="font-display text-h3 text-on-surface">Plan Storage</h3>
                <p className="text-on-surface-variant text-sm">Large Event Plan · 200 GB</p>
              </div>
              <div className="text-right">
                <div className="font-display text-h2 text-on-surface">{usedGB.toFixed(1)} <span className="text-on-surface-variant text-sm font-body-lg">/ {totalPlanGB} GB</span></div>
                <div className="text-on-surface-variant text-xs">{(totalPlanGB - usedGB).toFixed(1)} GB remaining</div>
              </div>
            </div>
            <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${usedPercent > 80 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-primary-container to-secondary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${usedPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-on-surface-variant mt-xs">
              <span>0 GB</span>
              <span className={usedPercent > 80 ? 'text-orange-400' : 'text-on-surface-variant'}>{usedPercent.toFixed(0)}% used</span>
              <span>{totalPlanGB} GB</span>
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Total Events', value: events.length, icon: 'event', color: 'text-primary' },
              { label: 'Photos Stored', value: events.reduce((a, e) => a + e.photos, 0).toLocaleString(), icon: 'photo_library', color: 'text-secondary' },
              { label: 'Videos Stored', value: events.reduce((a, e) => a + e.videos, 0), icon: 'videocam', color: 'text-primary' },
              { label: 'Transferable', value: events.filter(e => e.transferable).length, icon: 'move_item', color: 'text-secondary' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3 }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Transfer tip */}
          <div className="glass-card p-md rounded-2xl border border-secondary/20 bg-secondary/5 flex items-start gap-md">
            <span className="material-symbols-outlined text-secondary text-h2 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <div>
              <div className="font-label-md text-on-surface text-sm">Free your storage with Event Transfer</div>
              <div className="text-on-surface-variant text-xs mt-xs">After delivering photos, transfer event ownership to your client. Their gallery continues at ₹20/GB/year — and your business storage is freed instantly. The client gets full access forever.</div>
            </div>
          </div>

          {/* Event list */}
          <motion.div className="space-y-sm" variants={staggerContainer(0.06)} initial="hidden" animate="visible">
            {events.map((event) => {
              const sc = statusConfig[event.status];
              const usedPct = event.storage === 0 ? 0 : (event.storage / event.totalGB) * 100;
              const isExpanded = expandedEvent === event.id;
              return (
                <motion.div key={event.id} variants={fadeInUp} className="glass-card rounded-2xl overflow-hidden">
                  <div
                    className="p-md cursor-pointer"
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm flex-wrap">
                          <span className="font-label-md text-on-surface">{event.name}</span>
                          <span className={`text-xs px-sm py-0.5 rounded-full border font-label-md ${sc.color}`}>{sc.label}</span>
                        </div>
                        <div className="text-on-surface-variant text-xs mt-xs">{event.date} · {event.photos.toLocaleString()} photos · {event.videos} videos</div>
                      </div>
                      <div className="flex items-center gap-md flex-shrink-0">
                        <div className="text-right">
                          <div className="font-display text-h3 text-on-surface">{event.storage} GB</div>
                          <div className="text-on-surface-variant text-xs">of {event.totalGB} GB plan</div>
                        </div>
                        {event.transferable && (
                          <motion.button
                            className="px-sm py-xs bg-secondary/10 text-secondary border border-secondary/20 rounded-xl text-xs font-label-md flex items-center gap-xs"
                            onClick={e => { e.stopPropagation(); setTransferModal(event); setTransferStep(1); }}
                            whileHover={{ scale: 1.04 }}
                          >
                            <span className="material-symbols-outlined text-xs">move_item</span> Transfer
                          </motion.button>
                        )}
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
                        </motion.div>
                      </div>
                    </div>
                    {/* Storage bar */}
                    {event.storage > 0 && (
                      <div className="mt-sm">
                        <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${usedPct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-md pb-md border-t border-outline-variant/10 overflow-hidden"
                      >
                        <div className="pt-md grid grid-cols-2 md:grid-cols-4 gap-sm">
                          {[
                            { label: 'RAW files', value: `${(event.storage * 0.6).toFixed(1)} GB` },
                            { label: 'JPEGs', value: `${(event.storage * 0.3).toFixed(1)} GB` },
                            { label: 'Videos', value: `${(event.storage * 0.1).toFixed(1)} GB` },
                            { label: 'Client', value: event.client },
                          ].map((d, i) => (
                            <div key={i} className="bg-surface-container rounded-xl p-sm text-center">
                              <div className="font-label-md text-sm text-on-surface">{d.value}</div>
                              <div className="text-on-surface-variant text-xs">{d.label}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {transferModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setTransferModal(null)}>
            <motion.div className="bg-surface-container rounded-3xl p-xl w-full max-w-md shadow-2xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="flex items-center gap-sm mb-lg">
                <div className="w-10 h-10 rounded-2xl bg-secondary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>move_item</span>
                </div>
                <div>
                  <h2 className="font-display text-h2 text-on-surface">Transfer Event</h2>
                  <p className="text-on-surface-variant text-xs">{transferModal.name}</p>
                </div>
              </div>

              {transferStep === 1 ? (
                <>
                  <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-md mb-lg">
                    <div className="font-label-md text-sm text-on-surface mb-xs">What happens when you transfer:</div>
                    <div className="space-y-xs">
                      {[
                        `Client gets full Owner access to their gallery`,
                        `You become a Co-host (can still view)`,
                        `${transferModal.storage} GB freed from your plan instantly`,
                        `Client billed ₹${Math.round(transferModal.storage * 20)}/year for storage`,
                      ].map((t, i) => (
                        <div key={i} className="flex items-start gap-xs text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-secondary text-xs mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-on-surface-variant text-sm font-label-md mb-xs block">Client Email Address</label>
                    <input
                      value={transferEmail}
                      onChange={e => setTransferEmail(e.target.value)}
                      placeholder={`${transferModal.client.toLowerCase().replace(' ', '.')}@email.com`}
                      className="w-full bg-surface-variant border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-md">
                  <div className="w-16 h-16 bg-secondary/15 rounded-full flex items-center justify-center mx-auto mb-md">
                    <span className="material-symbols-outlined text-secondary text-h1" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                  </div>
                  <div className="font-display text-h3 text-on-surface mb-sm">Confirm Transfer</div>
                  <p className="text-on-surface-variant text-sm">A transfer invitation will be sent to <span className="text-primary">{transferEmail || `${transferModal.client} (default)`}</span>. Once accepted, {transferModal.storage} GB will be released from your plan.</p>
                </div>
              )}

              <div className="flex gap-sm mt-lg">
                <motion.button
                  className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25"
                  onClick={handleTransfer} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {transferStep === 1 ? 'Review Transfer →' : 'Send Transfer Invite'}
                </motion.button>
                <motion.button className="px-lg py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => { setTransferModal(null); setTransferStep(1); }} whileHover={{ scale: 1.02 }}>Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppSidebar>
  );
}
