import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';

const ICONS = ['photo_camera', 'celebration', 'favorite', 'auto_awesome', 'star', 'emoji_emotions', 'local_florist', 'music_note'];

const TRANSITIONS = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'flip', label: 'Flip' },
];

const THEMES = [
  { id: 'dark', label: 'Dark Luxe', bg: 'bg-[#0a0812]', text: 'text-white', accent: '#7c3aed' },
  { id: 'white', label: 'Clean White', bg: 'bg-white', text: 'text-gray-900', accent: '#7c3aed' },
  { id: 'gold', label: 'Royal Gold', bg: 'bg-[#0a0800]', text: 'text-yellow-100', accent: '#f59e0b' },
  { id: 'blush', label: 'Blush Pink', bg: 'bg-[#1a0812]', text: 'text-pink-100', accent: '#f472b6' },
];

const MOCK_PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  icon: ICONS[i % ICONS.length],
  ceremony: ['Haldi', 'Mehendi', 'Sangeet', 'Wedding'][i % 4],
  timestamp: `${Math.floor(Math.random() * 59 + 1)}s ago`,
}));

export default function LiveSlideshow() {
  const [isLive, setIsLive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transition, setTransition] = useState('fade');
  const [theme, setTheme] = useState(THEMES[0]);
  const [interval, setIntervalSec] = useState(4);
  const [showCaption, setShowCaption] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [filterCeremony, setFilterCeremony] = useState('All');
  const [photoCount, setPhotoCount] = useState(MOCK_PHOTOS.length);

  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => {
      setCurrentSlide(c => (c + 1) % MOCK_PHOTOS.length);
      if (Math.random() > 0.7) setPhotoCount(c => c + 1);
    }, interval * 1000);
    return () => clearInterval(t);
  }, [isLive, interval]);

  const filtered = filterCeremony === 'All' ? MOCK_PHOTOS : MOCK_PHOTOS.filter(p => p.ceremony === filterCeremony);
  const current = filtered[currentSlide % filtered.length];

  const getTransitionVariants = () => {
    if (transition === 'fade') return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    if (transition === 'slide') return { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -100, opacity: 0 } };
    if (transition === 'zoom') return { initial: { scale: 1.2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 } };
    return { initial: { rotateY: 90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, exit: { rotateY: -90, opacity: 0 } };
  };

  const tv = getTransitionVariants();

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <div>
            <h1 className="font-display text-h2 text-on-surface">Live Slideshow</h1>
            <p className="text-on-surface-variant text-xs">Real-time event photo wall for venue screens</p>
          </div>
          <div className="flex items-center gap-sm">
            {isLive && (
              <div className="flex items-center gap-xs text-green-400 text-sm font-label-md">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live · {photoCount} photos
              </div>
            )}
            <motion.button
              className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg ${isLive ? 'bg-red-500/20 text-red-400 border border-red-400/30' : 'bg-primary-container text-on-primary-container shadow-primary-container/25'}`}
              onClick={() => setIsLive(!isLive)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{isLive ? 'stop_circle' : 'play_circle'}</span>
              {isLive ? 'Stop Slideshow' : 'Go Live'}
            </motion.button>
            <motion.button
              className="px-md py-xs glass-card border border-outline-variant/20 text-on-surface rounded-xl text-sm font-label-md flex items-center gap-xs"
              onClick={() => setIsFullscreen(true)}
              whileHover={{ scale: 1.03 }}
            >
              <span className="material-symbols-outlined text-sm">fullscreen</span> Fullscreen
            </motion.button>
          </div>
        </motion.div>

        <div className="px-lg py-lg">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-xl">
            {/* Settings panel */}
            <div className="space-y-md">
              {/* Theme */}
              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Theme</h3>
                <div className="grid grid-cols-2 gap-sm">
                  {THEMES.map(t => (
                    <motion.div
                      key={t.id}
                      className={`rounded-xl overflow-hidden cursor-pointer border-2 ${theme.id === t.id ? 'border-primary-container' : 'border-transparent'}`}
                      onClick={() => setTheme(t)}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className={`h-12 ${t.bg} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${t.text}`}>Aa</span>
                      </div>
                      <div className={`text-xs font-label-md p-xs ${theme.id === t.id ? 'text-primary bg-primary-container/10' : 'text-on-surface-variant bg-surface-container'}`}>{t.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Transition */}
              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Transition</h3>
                <div className="grid grid-cols-2 gap-sm">
                  {TRANSITIONS.map(t => (
                    <motion.button
                      key={t.id}
                      className={`py-sm rounded-xl text-sm font-label-md border ${transition === t.id ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20'}`}
                      onClick={() => setTransition(t.id)}
                      whileHover={{ scale: 1.03 }}
                    >
                      {t.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Speed */}
              <div className="glass-card p-lg rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Slide Duration</h3>
                <div className="flex items-center gap-md">
                  <input type="range" min={2} max={10} value={interval} onChange={e => setIntervalSec(Number(e.target.value))} className="flex-1 accent-[#7c3aed]" />
                  <span className="text-primary font-display text-h3 w-12 text-right">{interval}s</span>
                </div>
              </div>

              {/* Options */}
              <div className="glass-card p-lg rounded-2xl space-y-md">
                <h3 className="font-display text-h3 text-on-surface">Display Options</h3>
                {[
                  { label: 'Show Caption', key: 'caption', val: showCaption, set: setShowCaption },
                  { label: 'Show Studio Logo', key: 'logo', val: showLogo, set: setShowLogo },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between">
                    <span className="text-on-surface font-label-md text-sm">{opt.label}</span>
                    <motion.div
                      className={`w-12 h-6 rounded-full relative cursor-pointer ${opt.val ? 'bg-primary-container' : 'bg-surface-variant'}`}
                      onClick={() => opt.set(!opt.val)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5" animate={{ left: opt.val ? '26px' : '2px' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    </motion.div>
                  </div>
                ))}
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-sm block">Filter Ceremony</label>
                  <div className="flex gap-xs flex-wrap">
                    {['All', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding'].map(c => (
                      <motion.button
                        key={c}
                        className={`px-sm py-xs rounded-full text-xs font-label-md ${filterCeremony === c ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}
                        onClick={() => setFilterCeremony(c)}
                        whileHover={{ scale: 1.05 }}
                      >
                        {c}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="xl:col-span-2">
              <div className="sticky top-24 space-y-md">
                <div className="flex items-center justify-between mb-sm">
                  <h3 className="font-display text-h3 text-on-surface">Preview</h3>
                  <div className="flex items-center gap-xs text-on-surface-variant text-xs">
                    Slide {(currentSlide % filtered.length) + 1} / {filtered.length}
                  </div>
                </div>
                <div className={`rounded-3xl overflow-hidden aspect-video relative ${theme.bg} shadow-2xl`} style={{ boxShadow: `0 20px 50px ${theme.accent}20` }}>
                  {/* Slideshow area */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      className="absolute inset-0 flex items-center justify-center"
                      variants={tv}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-2/3 h-2/3 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <span className={`material-symbols-outlined ${theme.text} opacity-20`} style={{ fontSize: 80, fontVariationSettings: "'FILL' 1" }}>{current?.icon || 'image'}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Caption */}
                  {showCaption && current && (
                    <motion.div className="absolute bottom-0 left-0 right-0 p-md bg-gradient-to-t from-black/60 to-transparent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={`cap-${currentSlide}`}>
                      <div className={`text-center ${theme.text}`}>
                        <div className="font-display text-h3">{current.ceremony} Ceremony</div>
                        <div className="text-sm opacity-60">{current.timestamp}</div>
                      </div>
                    </motion.div>
                  )}

                  {/* Logo */}
                  {showLogo && (
                    <div className="absolute top-md left-md flex items-center gap-xs">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.accent + '30' }}>
                        <span className="material-symbols-outlined text-xs" style={{ color: theme.accent, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <span className={`text-xs font-bold ${theme.text} opacity-70`}>Sharma Studios</span>
                    </div>
                  )}

                  {/* Live indicator */}
                  {isLive && (
                    <div className="absolute top-md right-md flex items-center gap-xs bg-red-500/80 text-white text-xs font-bold px-sm py-xs rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                    </div>
                  )}

                  {/* Play/pause overlay */}
                  {!isLive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <motion.button
                        className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
                        onClick={() => setIsLive(true)}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="material-symbols-outlined text-white text-h1" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-md">
                  <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant" onClick={() => setCurrentSlide(c => Math.max(0, c - 1))} whileHover={{ scale: 1.05 }}>
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </motion.button>
                  <div className="flex gap-xs">
                    {filtered.slice(0, 8).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`rounded-full transition-all cursor-pointer ${i === currentSlide % filtered.length ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-on-surface-variant/30'}`}
                        onClick={() => setCurrentSlide(i)}
                      />
                    ))}
                  </div>
                  <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant" onClick={() => setCurrentSlide(c => c + 1)} whileHover={{ scale: 1.05 }}>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </motion.button>
                </div>

                {/* Share to screen */}
                <div className="glass-card p-md rounded-2xl flex items-center gap-md">
                  <span className="material-symbols-outlined text-primary text-h2" style={{ fontVariationSettings: "'FILL' 1" }}>cast</span>
                  <div className="flex-1">
                    <div className="font-label-md text-sm text-on-surface">Cast to venue screen</div>
                    <div className="text-on-surface-variant text-xs">Open this URL on any display: eventra.ai/slideshow/sharma-2026</div>
                  </div>
                  <motion.button className="px-sm py-xs bg-primary-container text-on-primary-container rounded-lg text-xs font-label-md" whileHover={{ scale: 1.05 }}>Copy URL</motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className={`fixed inset-0 z-50 ${theme.bg} flex items-center justify-center`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <button className="absolute top-md right-md text-white/50 hover:text-white z-10" onClick={() => setIsFullscreen(false)}>
              <span className="material-symbols-outlined text-h1">close</span>
            </button>
            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} className="w-full h-full flex items-center justify-center" variants={tv} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}>
                <span className={`material-symbols-outlined ${theme.text} opacity-10`} style={{ fontSize: 400, fontVariationSettings: "'FILL' 1" }}>{current?.icon || 'image'}</span>
              </motion.div>
            </AnimatePresence>
            {showCaption && current && (
              <div className={`absolute bottom-xl left-0 right-0 text-center ${theme.text}`}>
                <div className="font-display text-display opacity-80">{current.ceremony}</div>
              </div>
            )}
            {isLive && <div className="absolute top-md left-md flex items-center gap-xs bg-red-500/80 text-white text-sm font-bold px-md py-xs rounded-full"><span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </AppSidebar>
  );
}
