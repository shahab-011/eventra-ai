import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const CAMERAS = [
  { id: 1, name: 'Canon EOS R5', model: 'Canon', status: 'connected', battery: 84, uploading: true, speed: '2.3 MB/s', uploaded: 3240 },
  { id: 2, name: 'Sony A7 IV', model: 'Sony', status: 'connected', battery: 61, uploading: false, speed: '0', uploaded: 1180 },
  { id: 3, name: 'Nikon Z9', model: 'Nikon', status: 'pairing', battery: null, uploading: false, speed: null, uploaded: 0 },
];

export default function Camera2CloudSetup() {
  const [step, setStep] = useState('dashboard');
  const [pairingCode, setPairingCode] = useState('SRM-4821');
  const [uploadCount, setUploadCount] = useState(3240);
  const [speed, setSpeed] = useState(2.3);

  useEffect(() => {
    if (step !== 'dashboard') return;
    const t = setInterval(() => {
      setUploadCount(c => c + Math.floor(Math.random() * 3));
      setSpeed(parseFloat((Math.random() * 1.5 + 1.5).toFixed(1)));
    }, 2000);
    return () => clearInterval(t);
  }, [step]);

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Camera2Cloud</h1>
          <motion.button
            className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
            onClick={() => setStep('pair')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm">add</span> Pair New Camera
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg">
          <AnimatePresence mode="wait">
            {step === 'pair' ? (
              <motion.div key="pair" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto">
                <div className="glass-card p-lg rounded-2xl text-center space-y-lg">
                  <div>
                    <h2 className="font-display text-h2 text-on-surface mb-xs">Pair a Camera</h2>
                    <p className="text-on-surface-variant text-sm">Open the Eventra app on your camera or use a CamFi / CamRanger bridge device.</p>
                  </div>
                  <motion.div
                    className="w-36 h-36 bg-primary-container/15 rounded-3xl flex items-center justify-center mx-auto border-2 border-primary-container/30"
                    animate={{ scale: [1, 1.04, 1], borderColor: ['rgba(124,58,237,0.3)', 'rgba(124,58,237,0.7)', 'rgba(124,58,237,0.3)'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <span className="font-display text-h1 text-primary tracking-widest">{pairingCode}</span>
                  </motion.div>
                  <div>
                    <p className="text-on-surface-variant text-sm mb-sm">Enter this code in the Eventra app on your device</p>
                    <motion.button
                      className="text-primary font-label-md text-sm"
                      onClick={() => setPairingCode(`SRM-${Math.floor(1000 + Math.random() * 9000)}`)}
                      whileHover={{ scale: 1.05 }}
                    >
                      Generate new code ↻
                    </motion.button>
                  </div>
                  <div className="flex gap-sm">
                    <motion.button className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep('dashboard')}>
                      Done
                    </motion.button>
                    <motion.button className="px-lg py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => setStep('dashboard')} whileHover={{ scale: 1.02 }}>
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-lg">
                {/* Stats */}
                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
                  {[
                    { label: 'Cameras Connected', value: '2', icon: 'camera_alt', color: 'text-primary' },
                    { label: 'Files Uploaded Today', value: uploadCount.toLocaleString(), icon: 'cloud_upload', color: 'text-secondary' },
                    { label: 'Avg Upload Speed', value: `${speed} MB/s`, icon: 'speed', color: 'text-secondary' },
                    { label: 'Uptime', value: '99.8%', icon: 'signal_wifi_4_bar', color: 'text-primary' },
                  ].map((s, i) => (
                    <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                      <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                      <div className="font-display text-h2 text-on-surface">{s.value}</div>
                      <div className="text-on-surface-variant text-sm">{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Live upload monitor */}
                <div className="glass-card p-lg rounded-2xl">
                  <div className="flex items-center gap-sm mb-lg">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                    <h3 className="font-display text-h3 text-on-surface">Live Upload Monitor</h3>
                  </div>
                  <div className="space-y-md">
                    {CAMERAS.map((cam, i) => (
                      <motion.div
                        key={cam.id}
                        className="bg-surface-container rounded-2xl p-md"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-md">
                          <div className="flex items-center gap-sm">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cam.status === 'connected' ? 'bg-secondary/15' : 'bg-yellow-400/15'}`}>
                              <span className={`material-symbols-outlined ${cam.status === 'connected' ? 'text-secondary' : 'text-yellow-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {cam.status === 'connected' ? 'camera_alt' : 'sync'}
                              </span>
                            </div>
                            <div>
                              <div className="font-label-md text-sm text-on-surface">{cam.name}</div>
                              <div className="text-on-surface-variant text-xs capitalize">{cam.status}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-md text-right">
                            {cam.battery !== null && (
                              <div>
                                <div className={`text-sm font-label-md ${cam.battery > 50 ? 'text-secondary' : 'text-yellow-400'}`}>{cam.battery}%</div>
                                <div className="text-on-surface-variant text-xs">battery</div>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-label-md text-on-surface">{cam.uploaded.toLocaleString()}</div>
                              <div className="text-on-surface-variant text-xs">uploaded</div>
                            </div>
                            {cam.speed && (
                              <div>
                                <div className="text-sm font-label-md text-secondary">{cam.speed}</div>
                                <div className="text-on-surface-variant text-xs">speed</div>
                              </div>
                            )}
                          </div>
                        </div>
                        {cam.uploading && (
                          <div>
                            <div className="flex justify-between text-xs text-on-surface-variant mb-xs">
                              <span>Uploading in progress</span>
                              <span className="text-secondary">Live</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-secondary to-primary-container rounded-full"
                                animate={{ x: ['0%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                style={{ width: '40%' }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* How it works */}
                <div className="glass-card p-lg rounded-2xl">
                  <h3 className="font-display text-h3 text-on-surface mb-md">How Camera2Cloud Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
                    {[
                      { step: '1', icon: 'camera_alt', label: 'You shoot', desc: 'Photograph normally on your camera' },
                      { step: '2', icon: 'wifi', label: 'Auto-sync', desc: 'Photos beam to Eventra cloud instantly' },
                      { step: '3', icon: 'face_6', label: 'AI processes', desc: 'Face recognition runs in real-time' },
                      { step: '4', icon: 'chat', label: 'Guests receive', desc: 'WhatsApp delivery while you\'re still shooting' },
                    ].map((s, i) => (
                      <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div className="relative inline-block mb-sm">
                          <div className="w-14 h-14 bg-primary-container/15 rounded-2xl flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-primary text-h2" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container text-xs font-bold">{s.step}</div>
                        </div>
                        <div className="font-label-md text-sm text-on-surface mb-xs">{s.label}</div>
                        <div className="text-on-surface-variant text-xs">{s.desc}</div>
                      </motion.div>
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
