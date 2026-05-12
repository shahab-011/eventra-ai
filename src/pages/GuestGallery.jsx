import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/animations';

const MOCK_PHOTOS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  yours: i < 8,
  liked: false,
}));

export default function GuestGallery() {
  const [phase, setPhase] = useState('selfie'); // selfie | loading | gallery
  const [filter, setFilter] = useState('yours');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [likes, setLikes] = useState({});

  const startLoading = () => {
    setPhase('loading');
    setTimeout(() => setPhase('gallery'), 2500);
  };

  const toggleLike = (id, e) => {
    e.stopPropagation();
    setLikes(l => ({ ...l, [id]: !l[id] }));
  };

  return (
    <div className="min-h-screen bg-[#0f0a1a] overflow-x-hidden">
      {/* Brand header */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-gutter py-sm bg-[#0f0a1a]/90 backdrop-blur-xl border-b border-white/5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-display text-base text-white">Sharma Wedding</span>
        </div>
        {phase === 'gallery' && (
          <div className="flex items-center gap-xs text-xs text-white/60">
            <span className="material-symbols-outlined text-xs text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Verified guest
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === 'selfie' && (
          <motion.div
            key="selfie"
            className="flex flex-col items-center justify-center min-h-screen pt-16 px-gutter pb-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 hero-glow pointer-events-none" />
            <motion.div
              className="text-center mb-xl relative z-10"
              variants={staggerContainer(0.1)}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-lg border border-primary-container/30">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>face_6</span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="font-display text-h1 text-white mb-sm">Find Your Photos</motion.h1>
              <motion.p variants={fadeInUp} className="text-white/60 text-lg max-w-sm mx-auto">
                Take a selfie to instantly find all your photos from Sharma Wedding using AI face recognition.
              </motion.p>
            </motion.div>

            <motion.div
              className="w-full max-w-sm space-y-sm relative z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                className="w-full bg-primary-container text-on-primary-container py-md rounded-2xl font-label-md text-base flex items-center justify-center gap-sm shadow-2xl shadow-primary-container/30"
                onClick={startLoading}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(124,58,237,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>camera_front</span>
                Take a Selfie
              </motion.button>
              <motion.button
                className="w-full bg-white/10 text-white py-md rounded-2xl font-label-md text-base flex items-center justify-center gap-sm border border-white/10"
                onClick={startLoading}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                Upload from Gallery
              </motion.button>
              <p className="text-center text-white/40 text-xs pt-sm">Your photo is used only for face matching and deleted after 24 hours.</p>
            </motion.div>
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            className="flex flex-col items-center justify-center min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-32 h-32 bg-primary-container/15 rounded-full flex items-center justify-center mb-lg border border-primary-container/30 relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 48 }}>sync</span>
              <div className="absolute inset-0 rounded-full border-2 border-primary-container/30 animate-ping" />
            </motion.div>
            <h2 className="font-display text-h2 text-white mb-sm">Scanning Your Face...</h2>
            <p className="text-white/60">Finding your photos across 3,240 images</p>
          </motion.div>
        )}

        {phase === 'gallery' && (
          <motion.div
            key="gallery"
            className="pt-20 pb-xl px-gutter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Success banner */}
            <motion.div
              className="mb-lg glass-card bg-secondary/10 border border-secondary/20 p-md rounded-2xl flex items-center gap-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="material-symbols-outlined text-secondary text-h2" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <div>
                <div className="text-white font-label-md">Found 42 photos of you!</div>
                <div className="text-white/60 text-xs">From Sharma Wedding · May 18, 2026</div>
              </div>
              <motion.button
                className="ml-auto bg-primary-container text-on-primary-container px-md py-xs rounded-xl font-label-md text-sm"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Download All
              </motion.button>
            </motion.div>

            {/* Filters */}
            <div className="flex gap-xs mb-md">
              {[
                { id: 'yours', label: 'Your Photos (42)' },
                { id: 'all', label: 'All Photos (3,240)' },
              ].map(f => (
                <motion.button
                  key={f.id}
                  className={`px-md py-xs rounded-xl text-sm font-label-md ${filter === f.id ? 'bg-primary-container text-on-primary-container' : 'bg-white/10 text-white/60 border border-white/10'}`}
                  onClick={() => setFilter(f.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {f.label}
                </motion.button>
              ))}
            </div>

            {/* Photo grid */}
            <motion.div
              className="grid grid-cols-3 gap-sm"
              variants={staggerContainer(0.03)}
              initial="hidden"
              animate="visible"
            >
              {MOCK_PHOTOS.filter(p => filter === 'all' || p.yours).map((photo) => (
                <motion.div
                  key={photo.id}
                  variants={fadeInUp}
                  className="relative rounded-xl overflow-hidden bg-white/5 group cursor-pointer aspect-square"
                  onClick={() => setSelectedPhoto(photo)}
                  whileHover={{ scale: 1.04 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/20 opacity-30" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>image</span>
                  </div>
                  {photo.yours && filter === 'all' && (
                    <div className="absolute top-1 left-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-background" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                  )}
                  <motion.button
                    className={`absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center ${likes[photo.id] ? 'bg-red-500' : 'bg-black/40'}`}
                    onClick={(e) => toggleLike(photo.id, e)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 14, fontVariationSettings: `'FILL' ${likes[photo.id] ? 1 : 0}` }}>favorite</span>
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>

            <p className="text-center text-white/40 text-xs mt-lg">Powered by Eventra AI · Eventra.ai</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 bg-[#0f0a1a]/95 backdrop-blur-xl z-50 flex items-center justify-center p-gutter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              className="max-w-sm w-full"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-square bg-white/5 rounded-3xl mb-md flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20" style={{ fontSize: 80, fontVariationSettings: "'FILL' 1" }}>image</span>
              </div>
              <div className="flex gap-sm">
                <motion.button className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md flex items-center justify-center gap-xs" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <span className="material-symbols-outlined text-sm">download</span> Download
                </motion.button>
                <motion.button className="flex-1 bg-white/10 text-white py-sm rounded-xl font-label-md flex items-center justify-center gap-xs border border-white/10" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <span className="material-symbols-outlined text-sm">share</span> Share
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
