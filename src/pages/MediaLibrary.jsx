import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const MOCK_PHOTOS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  event: i < 12 ? 'Sharma Wedding' : 'IIT Convocation',
  matched: i % 4 !== 0,
  processing: i === 5 || i === 11,
  size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
  date: '2026-05-18',
}));

const FILTERS = ['All', 'Sharma Wedding', 'IIT Convocation', 'TechCorp Meet'];
const VIEW_MODES = ['grid', 'masonry', 'list'];

export default function MediaLibrary() {
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const fileRef = useRef();

  const filtered = MOCK_PHOTOS.filter(p => {
    if (filter !== 'All' && p.event !== filter) return false;
    return true;
  });

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const newQueue = files.map((f, i) => ({ id: Date.now() + i, name: f.name, progress: 0 }));
    setUploadQueue(newQueue);
    newQueue.forEach((item, i) => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15 + 5;
        if (p >= 100) { p = 100; clearInterval(interval); }
        setUploadQueue(q => q.map(x => x.id === item.id ? { ...x, progress: Math.round(p) } : x));
      }, 200 + i * 50);
    });
  };

  const runAI = () => {
    setAiRunning(true);
    setTimeout(() => setAiRunning(false), 3000);
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Media Library</h1>
          <div className="flex items-center gap-sm">
            <motion.button
              className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs border ${aiRunning ? 'bg-primary-container/20 text-primary border-primary-container/30' : 'bg-secondary/10 text-secondary border-secondary/20'}`}
              onClick={runAI}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={`material-symbols-outlined text-sm ${aiRunning ? 'animate-spin' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {aiRunning ? 'progress_activity' : 'face_6'}
              </span>
              {aiRunning ? 'Running AI...' : 'Run AI Match'}
            </motion.button>
            <motion.button
              className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
              onClick={() => fileRef.current?.click()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span> Upload
            </motion.button>
            <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,video/*" />
          </div>
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
              { label: 'Total Files', value: '12,220', icon: 'photo_library', color: 'text-primary' },
              { label: 'AI Matched', value: '9,180', icon: 'face_6', color: 'text-secondary' },
              { label: 'Storage Used', value: '34 GB', icon: 'storage', color: 'text-primary' },
              { label: 'Processing', value: '142', icon: 'sync', color: 'text-yellow-400' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* AI running banner */}
          <AnimatePresence>
            {aiRunning && (
              <motion.div
                className="mb-md p-sm bg-primary-container/10 border border-primary-container/20 rounded-xl flex items-center gap-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />
                <span className="text-primary text-sm font-label-md">AI face recognition is running on 3,240 photos from Sharma Wedding...</span>
                <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden ml-md">
                  <motion.div
                    className="h-full bg-primary-container rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload queue */}
          <AnimatePresence>
            {uploadQueue.length > 0 && (
              <motion.div
                className="mb-md glass-card p-md rounded-2xl space-y-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-sm text-on-surface">Uploading {uploadQueue.length} file{uploadQueue.length > 1 ? 's' : ''}...</span>
                  <motion.button onClick={() => setUploadQueue([])} className="text-on-surface-variant text-xs" whileHover={{ scale: 1.1 }}>Clear</motion.button>
                </div>
                {uploadQueue.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-xs">
                      <span className="truncate max-w-xs">{item.name}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-secondary rounded-full"
                        animate={{ width: `${item.progress}%` }}
                        transition={{ ease: 'linear' }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-sm mb-md">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                placeholder="Search media..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-10 pr-md py-xs text-on-surface placeholder-outline text-sm focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-xs">
              {FILTERS.map(f => (
                <motion.button
                  key={f}
                  className={`px-sm py-xs rounded-xl text-xs font-label-md border ${filter === f ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20'}`}
                  onClick={() => setFilter(f)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
            <div className="flex gap-xs ml-auto">
              {VIEW_MODES.map(m => (
                <motion.button
                  key={m}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewMode === m ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}
                  onClick={() => setViewMode(m)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="material-symbols-outlined text-sm">
                    {m === 'grid' ? 'grid_view' : m === 'masonry' ? 'dashboard' : 'view_list'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Drop zone when empty or dragging */}
          <motion.div
            className={`mb-md border-2 border-dashed rounded-2xl p-lg flex flex-col items-center justify-center gap-sm cursor-pointer transition-all ${isDragging ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/20 hover:border-outline-variant/40'}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            whileHover={{ scale: 1.005 }}
          >
            <motion.div
              animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: isDragging ? Infinity : 0, duration: 0.8 }}
            >
              <span className={`material-symbols-outlined text-h1 ${isDragging ? 'text-primary-container' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
            </motion.div>
            <span className={`font-label-md text-sm ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>
              {isDragging ? 'Drop files here' : 'Drag & drop photos/videos or click to browse'}
            </span>
            <span className="text-on-surface-variant text-xs">JPG, PNG, HEIC, MP4, MOV — up to 5 GB per file</span>
          </motion.div>

          {/* Media grid */}
          <motion.div
            className={`${viewMode === 'list' ? 'space-y-sm' : 'grid gap-sm'} ${viewMode === 'grid' ? 'grid-cols-3 md:grid-cols-6' : viewMode === 'masonry' ? 'grid-cols-2 md:grid-cols-4' : ''}`}
            variants={staggerContainer(0.03)}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((photo, i) => (
              viewMode === 'list' ? (
                <motion.div
                  key={photo.id}
                  variants={fadeInUp}
                  className="glass-card p-sm rounded-xl flex items-center gap-md hover:bg-surface-container/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-on-surface text-sm font-label-md">IMG_{String(photo.id).padStart(4, '0')}.JPG</div>
                    <div className="text-on-surface-variant text-xs">{photo.event} · {photo.size} · {photo.date}</div>
                  </div>
                  <div className="flex items-center gap-sm flex-shrink-0">
                    {photo.matched && <span className="bg-secondary/10 text-secondary text-xs px-sm py-xs rounded-full border border-secondary/20 font-label-md">Matched</span>}
                    {photo.processing && <span className="bg-yellow-400/10 text-yellow-400 text-xs px-sm py-xs rounded-full border border-yellow-400/20 font-label-md">Processing</span>}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={photo.id}
                  variants={fadeInUp}
                  className={`relative rounded-xl overflow-hidden bg-surface-container cursor-pointer group ${viewMode === 'masonry' && i % 3 === 0 ? 'row-span-2' : ''}`}
                  style={{ aspectRatio: viewMode === 'masonry' && i % 3 === 0 ? '1/2' : '1/1' }}
                  onClick={() => setSelectedPhoto(photo)}
                  whileHover={{ scale: 1.03, zIndex: 10 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant opacity-20" style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>image</span>
                  </div>
                  {photo.matched && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-background" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                  )}
                  {photo.processing && (
                    <div className="absolute top-1 left-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-background animate-spin" style={{ fontSize: 12 }}>sync</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-xs">
                    <motion.button className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center" whileHover={{ scale: 1.15 }} onClick={e => e.stopPropagation()}>
                      <span className="material-symbols-outlined text-white text-xs">open_in_new</span>
                    </motion.button>
                    <motion.button className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center" whileHover={{ scale: 1.15 }} onClick={e => e.stopPropagation()}>
                      <span className="material-symbols-outlined text-white text-xs">download</span>
                    </motion.button>
                    <motion.button className="w-7 h-7 bg-red-500/40 rounded-lg flex items-center justify-center" whileHover={{ scale: 1.15 }} onClick={e => e.stopPropagation()}>
                      <span className="material-symbols-outlined text-white text-xs">delete</span>
                    </motion.button>
                  </div>
                </motion.div>
              )
            ))}
          </motion.div>
        </div>

        {/* Photo lightbox */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 flex items-center justify-center p-gutter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
            >
              <motion.div
                className="glass-card rounded-3xl p-lg max-w-lg w-full"
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="aspect-square bg-surface-container rounded-2xl mb-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: 80, fontVariationSettings: "'FILL' 1" }}>image</span>
                </div>
                <div className="space-y-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base text-on-surface">IMG_{String(selectedPhoto.id).padStart(4, '0')}.JPG</span>
                    <div className="flex gap-xs">
                      {selectedPhoto.matched && <span className="bg-secondary/10 text-secondary text-xs px-sm py-xs rounded-full border border-secondary/20">Matched</span>}
                    </div>
                  </div>
                  <div className="text-on-surface-variant text-sm">{selectedPhoto.event} · {selectedPhoto.size} · {selectedPhoto.date}</div>
                  <div className="flex gap-sm pt-sm">
                    <motion.button className="flex-1 bg-primary-container text-on-primary-container py-xs rounded-xl font-label-md text-sm flex items-center justify-center gap-xs" whileHover={{ scale: 1.02 }}>
                      <span className="material-symbols-outlined text-sm">download</span> Download
                    </motion.button>
                    <motion.button className="flex-1 bg-surface-container border border-outline-variant/20 text-on-surface py-xs rounded-xl font-label-md text-sm flex items-center justify-center gap-xs" whileHover={{ scale: 1.02 }}>
                      <span className="material-symbols-outlined text-sm">auto_fix_high</span> Edit with AI
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppSidebar>
  );
}
