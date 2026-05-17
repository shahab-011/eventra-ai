import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const QR_CODES = [
  { id: 1, name: 'Studio Master QR', scope: 'All Events', url: 'eventra.ai/s/sharma-studios', scans: 1247, created: 'Jan 2024', type: 'studio', active: true },
  { id: 2, name: 'Sharma Wedding', scope: 'Parent Event', url: 'eventra.ai/e/sharma-wedding-2026', scans: 312, created: 'May 2026', type: 'event', active: true },
  { id: 3, name: 'Haldi Ceremony', scope: 'Sub-event', url: 'eventra.ai/e/sharma-wedding-2026/haldi', scans: 67, created: 'May 2026', type: 'subevent', active: true },
  { id: 4, name: 'Mehendi Ceremony', scope: 'Sub-event', url: 'eventra.ai/e/sharma-wedding-2026/mehendi', scans: 91, created: 'May 2026', type: 'subevent', active: true },
  { id: 5, name: 'Sangeet Night', scope: 'Sub-event', url: 'eventra.ai/e/sharma-wedding-2026/sangeet', scans: 203, created: 'May 2026', type: 'subevent', active: true },
  { id: 6, name: 'Wedding Ceremony', scope: 'Sub-event', url: 'eventra.ai/e/sharma-wedding-2026/wedding', scans: 0, created: 'May 2026', type: 'subevent', active: false },
];

const typeConfig = {
  studio: { label: 'Studio', color: 'text-primary bg-primary-container/15 border-primary-container/30', icon: 'store' },
  event: { label: 'Event', color: 'text-secondary bg-secondary/10 border-secondary/20', icon: 'event' },
  subevent: { label: 'Sub-event', color: 'text-on-surface-variant bg-surface-variant/30 border-outline-variant/20', icon: 'event_note' },
};

const QRPattern = ({ size = 120, color = '#7c3aed' }) => (
  <svg width={size} height={size} viewBox="0 0 21 21" style={{ imageRendering: 'pixelated' }}>
    {[
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
      [0,1],[6,1],[0,2],[2,2],[3,2],[4,2],[6,2],
      [0,3],[2,3],[4,3],[6,3],[0,4],[2,4],[3,4],[4,4],[6,4],
      [0,5],[6,5],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
      [8,0],[10,0],[8,2],[9,2],[11,2],[8,3],[10,3],[9,4],[11,4],[8,5],[9,5],[11,5],
      [14,0],[15,0],[16,0],[17,0],[18,0],[19,0],[20,0],
      [14,1],[20,1],[14,2],[16,2],[17,2],[18,2],[20,2],
      [14,3],[16,3],[18,3],[20,3],[14,4],[16,4],[17,4],[18,4],[20,4],
      [14,5],[20,5],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],[20,6],
      [0,14],[1,14],[2,14],[3,14],[4,14],[5,14],[6,14],
      [0,15],[6,15],[0,16],[2,16],[3,16],[4,16],[6,16],
      [0,17],[2,17],[4,17],[6,17],[0,18],[2,18],[3,18],[4,18],[6,18],
      [0,19],[6,19],[0,20],[1,20],[2,20],[3,20],[4,20],[5,20],[6,20],
      [8,8],[9,8],[11,8],[12,8],[9,9],[10,9],[12,9],[8,10],[11,10],[9,11],[10,11],[12,11],
      [8,14],[9,14],[11,14],[8,15],[10,15],[12,15],[9,16],[11,16],[12,16],
    ].map(([x, y], i) => (
      <rect key={i} x={x} y={y} width={1} height={1} fill={color} />
    ))}
  </svg>
);

export default function QRCodeManager() {
  const [qrCodes, setQrCodes] = useState(QR_CODES);
  const [activeQR, setActiveQR] = useState(QR_CODES[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [qrColor, setQrColor] = useState('#7c3aed');
  const [qrBg, setQrBg] = useState('#15121b');
  const [qrSize, setQrSize] = useState('medium');
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalScans = qrCodes.reduce((a, q) => a + q.scans, 0);

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">QR Code Manager</h1>
          <motion.button
            className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
            onClick={() => setShowCreate(true)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm">add</span> New QR Code
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg">
          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Total QR Codes', value: qrCodes.length, icon: 'qr_code', color: 'text-primary' },
              { label: 'Total Scans', value: totalScans.toLocaleString(), icon: 'qr_code_scanner', color: 'text-secondary' },
              { label: 'Active Codes', value: qrCodes.filter(q => q.active).length, icon: 'check_circle', color: 'text-secondary' },
              { label: 'Reusable Studio QR', value: '1', icon: 'loop', color: 'text-primary' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3 }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
            {/* QR list */}
            <div className="lg:col-span-2 space-y-sm">
              <motion.div className="space-y-sm" variants={staggerContainer(0.06)} initial="hidden" animate="visible">
                {qrCodes.map((qr) => {
                  const tc = typeConfig[qr.type];
                  const isActive = activeQR?.id === qr.id;
                  return (
                    <motion.div
                      key={qr.id}
                      variants={fadeInUp}
                      className={`glass-card p-md rounded-2xl cursor-pointer transition-all ${isActive ? 'border border-primary-container/40 bg-primary-container/5' : 'border border-transparent hover:border-outline-variant/20'}`}
                      onClick={() => setActiveQR(qr)}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-center gap-md">
                        {/* Mini QR preview */}
                        <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0 overflow-hidden p-xs">
                          <QRPattern size={48} color={isActive ? '#7c3aed' : '#888'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-sm flex-wrap">
                            <span className="font-label-md text-on-surface">{qr.name}</span>
                            <span className={`text-xs px-sm py-0.5 rounded-full border font-label-md ${tc.color}`}>{tc.label}</span>
                            {!qr.active && <span className="text-xs bg-red-400/10 text-red-400 border border-red-400/20 px-sm py-0.5 rounded-full">Inactive</span>}
                          </div>
                          <div className="text-on-surface-variant text-xs mt-xs font-mono truncate">{qr.url}</div>
                          <div className="flex items-center gap-md mt-xs">
                            <span className="text-on-surface-variant text-xs flex items-center gap-xs">
                              <span className="material-symbols-outlined text-xs">qr_code_scanner</span> {qr.scans.toLocaleString()} scans
                            </span>
                            <span className="text-on-surface-variant text-xs">{qr.scope}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-sm flex-shrink-0">
                          <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-primary" whileHover={{ scale: 1.05 }} title="Download">
                            <span className="material-symbols-outlined text-sm">download</span>
                          </motion.button>
                          <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-primary" whileHover={{ scale: 1.05 }} title="Share">
                            <span className="material-symbols-outlined text-sm">share</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* QR Preview + customise */}
            <div className="sticky top-24 space-y-md">
              {activeQR && (
                <>
                  <div className="glass-card p-lg rounded-2xl text-center">
                    <h3 className="font-display text-h3 text-on-surface mb-sm">{activeQR.name}</h3>
                    <div className="inline-flex items-center justify-center rounded-2xl p-lg mb-md" style={{ backgroundColor: qrBg }}>
                      <QRPattern size={160} color={qrColor} />
                    </div>
                    <div className="flex items-center gap-sm mb-md">
                      <div className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-xs text-on-surface-variant text-xs font-mono truncate">
                        {activeQR.url}
                      </div>
                      <motion.button
                        className="px-sm py-xs bg-primary-container text-on-primary-container rounded-lg text-xs font-label-md flex items-center gap-xs"
                        onClick={copyLink} whileHover={{ scale: 1.05 }}
                      >
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{copied ? 'check' : 'content_copy'}</span>
                        {copied ? 'Copied!' : 'Copy'}
                      </motion.button>
                    </div>
                    <div className="flex gap-sm">
                      <motion.button className="flex-1 py-sm bg-primary-container text-on-primary-container rounded-xl font-label-md text-sm flex items-center justify-center gap-xs shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <span className="material-symbols-outlined text-sm">download</span> Download PNG
                      </motion.button>
                      <motion.button className="px-md py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md text-sm flex items-center gap-xs" whileHover={{ scale: 1.02 }}>
                        <span className="material-symbols-outlined text-sm">print</span> Print
                      </motion.button>
                    </div>
                  </div>

                  {/* Customise */}
                  <div className="glass-card p-lg rounded-2xl space-y-md">
                    <h3 className="font-display text-h3 text-on-surface">Customise</h3>
                    <div>
                      <label className="text-on-surface-variant text-sm font-label-md mb-xs block">QR Color</label>
                      <div className="flex items-center gap-sm">
                        <input type="color" value={qrColor} onChange={e => setQrColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer" />
                        <input value={qrColor} onChange={e => setQrColor(e.target.value)} className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-xs text-on-surface text-sm font-mono outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-on-surface-variant text-sm font-label-md mb-xs block">Background Color</label>
                      <div className="flex items-center gap-sm">
                        <input type="color" value={qrBg} onChange={e => setQrBg(e.target.value)} className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer" />
                        <input value={qrBg} onChange={e => setQrBg(e.target.value)} className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-xs text-on-surface text-sm font-mono outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-on-surface-variant text-sm font-label-md mb-sm block">Export Size</label>
                      <div className="flex gap-sm">
                        {['small', 'medium', 'large'].map(s => (
                          <motion.button
                            key={s}
                            className={`flex-1 py-xs rounded-xl text-xs font-label-md capitalize ${qrSize === s ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}
                            onClick={() => setQrSize(s)}
                            whileHover={{ scale: 1.03 }}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
