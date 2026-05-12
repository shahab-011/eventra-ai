import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const QUEUE = [
  { id: 1, name: 'IMG_0042.JPG', event: 'Sharma Wedding', status: 'matched', confidence: 97, faces: 3 },
  { id: 2, name: 'IMG_0043.JPG', event: 'Sharma Wedding', status: 'matched', confidence: 94, faces: 1 },
  { id: 3, name: 'IMG_0044.JPG', event: 'Sharma Wedding', status: 'low_confidence', confidence: 71, faces: 2 },
  { id: 4, name: 'IMG_0045.JPG', event: 'IIT Convocation', status: 'processing', confidence: null, faces: null },
  { id: 5, name: 'IMG_0046.JPG', event: 'IIT Convocation', status: 'processing', confidence: null, faces: null },
  { id: 6, name: 'IMG_0047.JPG', event: 'Sharma Wedding', status: 'unmatched', confidence: 0, faces: 0 },
];

export default function AIFaceRecognitionHub() {
  const [progress, setProgress] = useState(67);
  const [activeJob, setActiveJob] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [selectedEvent, setSelectedEvent] = useState('All Events');

  useEffect(() => {
    if (!activeJob) return;
    const t = setInterval(() => setProgress(p => Math.min(p + Math.random() * 0.3, 100)), 500);
    return () => clearInterval(t);
  }, [activeJob]);

  const statusColor = (s) => ({
    matched: 'bg-secondary/10 text-secondary border-secondary/20',
    low_confidence: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    processing: 'bg-primary/10 text-primary border-primary/20',
    unmatched: 'bg-red-500/10 text-red-400 border-red-500/20',
  })[s] ?? '';

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">AI Face Recognition</h1>
          <motion.button
            className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs border ${activeJob ? 'bg-primary/10 text-primary border-primary/20' : 'bg-primary-container text-on-primary-container border-primary-container/30 shadow-lg shadow-primary-container/25'}`}
            onClick={() => setActiveJob(j => !j)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {activeJob ? 'pause_circle' : 'play_circle'}
            </span>
            {activeJob ? 'Pause Processing' : 'Start AI Run'}
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg">
          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg"
            variants={staggerContainer(0.07)}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: 'Total Processed', value: '9,180', icon: 'photo_library', color: 'text-primary' },
              { label: 'Faces Matched', value: '8,642', icon: 'face_6', color: 'text-secondary' },
              { label: 'Match Rate', value: '94.1%', icon: 'analytics', color: 'text-secondary' },
              { label: 'Low Confidence', value: '538', icon: 'warning', color: 'text-yellow-400' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            {/* Active job progress */}
            <div className="lg:col-span-2 space-y-md">
              <AnimatePresence>
                {activeJob && (
                  <motion.div
                    className="glass-card p-lg rounded-2xl"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center justify-between mb-md">
                      <div>
                        <h3 className="font-display text-h3 text-on-surface">Processing: Sharma Wedding</h3>
                        <p className="text-on-surface-variant text-sm">3,240 photos · Started 4 min ago</p>
                      </div>
                      <div className="flex items-center gap-xs">
                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        <span className="text-secondary text-sm font-label-md">Live</span>
                      </div>
                    </div>
                    <div className="mb-sm">
                      <div className="flex justify-between text-sm mb-xs">
                        <span className="text-on-surface-variant">Progress</span>
                        <span className="text-on-surface font-label-md">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary-container to-secondary"
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: 'linear', duration: 0.5 }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-sm text-center">
                      {[
                        { label: 'Processed', value: Math.round(3240 * progress / 100).toLocaleString() },
                        { label: 'Matched', value: Math.round(3240 * progress / 100 * 0.941).toLocaleString() },
                        { label: 'Remaining', value: Math.round(3240 * (1 - progress / 100)).toLocaleString() },
                      ].map((s, i) => (
                        <div key={i} className="bg-surface-container rounded-xl p-sm">
                          <div className="font-display text-h3 text-on-surface">{s.value}</div>
                          <div className="text-on-surface-variant text-xs">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Match queue */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-lg py-md border-b border-outline-variant/10 flex items-center justify-between">
                  <h3 className="font-display text-h3 text-on-surface">Match Queue</h3>
                  <select
                    value={selectedEvent}
                    onChange={e => setSelectedEvent(e.target.value)}
                    className="bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-xs text-on-surface text-xs outline-none"
                  >
                    {['All Events', 'Sharma Wedding', 'IIT Convocation'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="divide-y divide-outline-variant/5">
                  {QUEUE.map((item, i) => (
                    <motion.div
                      key={item.id}
                      className="px-lg py-sm flex items-center gap-md hover:bg-surface-container/30 transition-colors"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center flex-shrink-0">
                        {item.status === 'processing' ? (
                          <span className="material-symbols-outlined text-primary animate-spin text-sm">sync</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-on-surface text-sm font-label-md">{item.name}</div>
                        <div className="text-on-surface-variant text-xs">{item.event}</div>
                      </div>
                      {item.confidence !== null && (
                        <div className="text-center flex-shrink-0">
                          <div className={`text-sm font-label-md ${item.confidence >= 80 ? 'text-secondary' : item.confidence > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {item.confidence > 0 ? `${item.confidence}%` : '—'}
                          </div>
                          <div className="text-on-surface-variant text-xs">confidence</div>
                        </div>
                      )}
                      {item.faces !== null && (
                        <div className="text-center flex-shrink-0">
                          <div className="text-sm font-label-md text-on-surface">{item.faces}</div>
                          <div className="text-on-surface-variant text-xs">faces</div>
                        </div>
                      )}
                      <span className={`text-xs px-sm py-xs rounded-full border font-label-md flex-shrink-0 ${statusColor(item.status)}`}>
                        {item.status === 'low_confidence' ? 'Low Conf.' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings panel */}
            <div className="space-y-md">
              <div className="glass-card p-lg rounded-2xl space-y-md">
                <h3 className="font-display text-h3 text-on-surface">AI Settings</h3>
                <div>
                  <div className="flex justify-between text-sm mb-sm">
                    <span className="text-on-surface-variant">Confidence Threshold</span>
                    <span className="text-primary font-label-md">{threshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-on-surface-variant mt-xs">
                    <span>More matches</span>
                    <span>Higher accuracy</span>
                  </div>
                </div>
                {[
                  { label: 'Auto-deliver on match', desc: 'Send WhatsApp immediately after matching' },
                  { label: 'Group photos by person', desc: 'Organise gallery into face clusters' },
                  { label: 'Flag low-confidence for review', desc: 'Matches below threshold need manual approval' },
                ].map((opt, i) => (
                  <div key={i} className="flex items-start justify-between gap-sm">
                    <div>
                      <div className="text-on-surface text-sm font-label-md">{opt.label}</div>
                      <div className="text-on-surface-variant text-xs">{opt.desc}</div>
                    </div>
                    <motion.div
                      className="w-10 h-5 rounded-full bg-primary-container flex-shrink-0 relative cursor-pointer"
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5" />
                    </motion.div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Accuracy Breakdown</h3>
                {[
                  { label: 'High confidence (95%+)', count: 7240, color: 'bg-secondary' },
                  { label: 'Good (80–94%)', count: 1402, color: 'bg-primary-container' },
                  { label: 'Low (below 80%)', count: 538, color: 'bg-yellow-400' },
                ].map((r, i) => (
                  <div key={i} className="mb-sm">
                    <div className="flex justify-between text-xs text-on-surface-variant mb-xs">
                      <span>{r.label}</span>
                      <span className="text-on-surface font-label-md">{r.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${r.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(r.count / 9180) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
