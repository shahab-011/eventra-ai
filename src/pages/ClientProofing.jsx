import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const PHOTOS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  thumb: `https://picsum.photos/seed/proof${i + 1}/400/300`,
  ceremony: ['Haldi', 'Mehendi', 'Sangeet', 'Wedding'][i % 4],
  favorites: Math.floor(Math.random() * 5),
  comments: Math.floor(Math.random() * 3),
  selected: Math.random() > 0.6,
  flagged: Math.random() > 0.85,
}));

const GUESTS = [
  { id: 1, name: 'Priya Sharma (Bride)', initials: 'PS', color: 'from-pink-500 to-rose-500', selections: 14, favorites: 8, comments: 3, lastActive: '2 min ago' },
  { id: 2, name: 'Arjun Verma (Groom)', initials: 'AV', color: 'from-primary-container to-secondary-container', selections: 9, favorites: 5, comments: 1, lastActive: '8 min ago' },
  { id: 3, name: 'Sunita Sharma (Mother)', initials: 'SS', color: 'from-amber-500 to-orange-500', selections: 22, favorites: 12, comments: 5, lastActive: '15 min ago' },
  { id: 4, name: 'Rajesh Verma (Father)', initials: 'RV', color: 'from-blue-500 to-indigo-500', selections: 6, favorites: 3, comments: 0, lastActive: '1 hr ago' },
];

export default function ClientProofing() {
  const [photos, setPhotos] = useState(PHOTOS);
  const [activeGuest, setActiveGuest] = useState(null);
  const [filterCeremony, setFilterCeremony] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('grid');
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [exported, setExported] = useState(false);

  const ceremonies = ['All', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding'];

  const filtered = photos.filter(p => {
    const ceremonyMatch = filterCeremony === 'All' || p.ceremony === filterCeremony;
    const statusMatch =
      filterStatus === 'all' ? true :
      filterStatus === 'selected' ? p.selected :
      filterStatus === 'favorites' ? p.favorites > 0 :
      filterStatus === 'flagged' ? p.flagged : true;
    return ceremonyMatch && statusMatch;
  });

  const toggleSelected = (id) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  const toggleFavorite = (id) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, favorites: p.favorites > 0 ? 0 : 1 } : p));

  const totalSelected = photos.filter(p => p.selected).length;
  const totalFavorites = photos.filter(p => p.favorites > 0).length;
  const totalComments = photos.reduce((a, p) => a + p.comments, 0);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <div>
            <h1 className="font-display text-h2 text-on-surface">Client Proofing</h1>
            <p className="text-on-surface-variant text-xs">Sharma–Verma Wedding · Live selections syncing</p>
          </div>
          <div className="flex items-center gap-sm">
            <div className="flex items-center gap-xs text-secondary text-xs font-label-md">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              Live Sync
            </div>
            <AnimatePresence>
              {exported && (
                <motion.div className="text-secondary text-sm font-label-md flex items-center gap-xs" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Exported!
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
              onClick={handleExport} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm">download</span> Export Selections
            </motion.button>
          </div>
        </motion.div>

        <div className="px-lg py-lg">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-lg">
            {/* Left: Guest activity panel */}
            <div className="xl:col-span-1 space-y-md">
              {/* Summary stats */}
              <motion.div className="grid grid-cols-3 gap-sm" variants={staggerContainer(0.05)} initial="hidden" animate="visible">
                {[
                  { label: 'Selected', value: totalSelected, icon: 'check_circle', color: 'text-secondary' },
                  { label: 'Favorited', value: totalFavorites, icon: 'favorite', color: 'text-pink-400' },
                  { label: 'Comments', value: totalComments, icon: 'chat_bubble', color: 'text-primary' },
                ].map((s, i) => (
                  <motion.div key={i} variants={fadeInUp} className="glass-card p-sm rounded-2xl text-center">
                    <span className={`material-symbols-outlined text-h3 ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    <div className="font-display text-h3 text-on-surface">{s.value}</div>
                    <div className="text-on-surface-variant text-xs">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Client activity */}
              <div className="glass-card p-md rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-md">Client Activity</h3>
                <div className="space-y-sm">
                  {GUESTS.map((g, i) => (
                    <motion.div
                      key={g.id}
                      className={`p-sm rounded-xl cursor-pointer transition-colors ${activeGuest?.id === g.id ? 'bg-primary-container/15 border border-primary-container/30' : 'hover:bg-surface-container'}`}
                      onClick={() => setActiveGuest(activeGuest?.id === g.id ? null : g)}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    >
                      <div className="flex items-center gap-sm mb-xs">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{g.initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-on-surface font-label-md text-xs truncate">{g.name}</div>
                          <div className="text-on-surface-variant text-xs">{g.lastActive}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-xs text-center">
                        {[
                          { val: g.selections, label: 'sel', color: 'text-secondary' },
                          { val: g.favorites, label: 'fav', color: 'text-pink-400' },
                          { val: g.comments, label: 'cmt', color: 'text-primary' },
                        ].map((m, j) => (
                          <div key={j}>
                            <div className={`font-bold text-sm ${m.color}`}>{m.val}</div>
                            <div className="text-on-surface-variant text-xs">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent comments */}
              <div className="glass-card p-md rounded-2xl">
                <h3 className="font-display text-h3 text-on-surface mb-sm">Recent Comments</h3>
                <div className="space-y-sm">
                  {[
                    { author: 'Priya', comment: 'Love this one! Please include it.', time: '2m' },
                    { author: 'Sunita', comment: 'Can you make this brighter?', time: '10m' },
                    { author: 'Arjun', comment: 'This is my favourite shot of the day.', time: '25m' },
                  ].map((c, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-primary font-label-md">{c.author}: </span>
                      <span className="text-on-surface-variant">{c.comment}</span>
                      <span className="text-on-surface-variant/50 text-xs ml-xs">{c.time} ago</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Photo grid */}
            <div className="xl:col-span-3 space-y-md">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-sm">
                <div className="flex gap-xs overflow-x-auto">
                  {ceremonies.map(c => (
                    <motion.button
                      key={c}
                      className={`px-sm py-xs rounded-full text-xs font-label-md whitespace-nowrap ${filterCeremony === c ? 'bg-primary-container text-on-primary-container' : 'glass-card text-on-surface-variant border border-outline-variant/20'}`}
                      onClick={() => setFilterCeremony(c)}
                      whileHover={{ scale: 1.05 }}
                    >
                      {c}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-xs ml-auto">
                  {[
                    { val: 'all', label: 'All' },
                    { val: 'selected', label: 'Selected' },
                    { val: 'favorites', label: 'Favorites' },
                    { val: 'flagged', label: 'Flagged' },
                  ].map(f => (
                    <motion.button
                      key={f.val}
                      className={`px-sm py-xs rounded-full text-xs font-label-md ${filterStatus === f.val ? 'bg-secondary/20 text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                      onClick={() => setFilterStatus(f.val)}
                      whileHover={{ scale: 1.05 }}
                    >
                      {f.label}
                    </motion.button>
                  ))}
                  <div className="flex gap-xs ml-sm">
                    {['grid_view', 'view_list'].map((icon, idx) => (
                      <motion.button
                        key={icon}
                        className={`p-xs rounded-lg ${view === (idx === 0 ? 'grid' : 'list') ? 'bg-primary-container/20 text-primary' : 'text-on-surface-variant'}`}
                        onClick={() => setView(idx === 0 ? 'grid' : 'list')}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="material-symbols-outlined text-sm">{icon}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-on-surface-variant text-xs">{filtered.length} photos · {totalSelected} selected</div>

              {/* Photo Grid */}
              <motion.div
                className={view === 'grid' ? 'grid grid-cols-3 md:grid-cols-4 gap-sm' : 'space-y-sm'}
                layout
              >
                <AnimatePresence>
                  {filtered.map((photo) => (
                    <motion.div
                      key={photo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative group cursor-pointer rounded-xl overflow-hidden ${photo.selected ? 'ring-2 ring-secondary ring-offset-1 ring-offset-background' : ''}`}
                      onClick={() => setExpandedPhoto(photo)}
                    >
                      {view === 'grid' ? (
                        <>
                          <div className="aspect-square bg-surface-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-h1 text-on-surface-variant/20" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                          </div>
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-xs opacity-0 group-hover:opacity-100">
                            <motion.button
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${photo.selected ? 'bg-secondary text-on-primary-container' : 'bg-white/20 text-white'}`}
                              onClick={e => { e.stopPropagation(); toggleSelected(photo.id); }}
                              whileHover={{ scale: 1.1 }}
                            >
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{photo.selected ? 'check_circle' : 'radio_button_unchecked'}</span>
                            </motion.button>
                            <motion.button
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${photo.favorites > 0 ? 'bg-pink-500 text-white' : 'bg-white/20 text-white'}`}
                              onClick={e => { e.stopPropagation(); toggleFavorite(photo.id); }}
                              whileHover={{ scale: 1.1 }}
                            >
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: photo.favorites > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                            </motion.button>
                          </div>
                          {/* Badges */}
                          <div className="absolute top-xs left-xs flex gap-xs">
                            {photo.selected && <span className="w-4 h-4 bg-secondary rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-white" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>check</span></span>}
                            {photo.favorites > 0 && <span className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-white" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>favorite</span></span>}
                            {photo.flagged && <span className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-white" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>flag</span></span>}
                          </div>
                          {photo.comments > 0 && (
                            <div className="absolute bottom-xs right-xs bg-black/60 text-white text-xs rounded-full px-xs py-0.5 flex items-center gap-xs">
                              <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>chat_bubble</span> {photo.comments}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-md p-md glass-card rounded-xl">
                          <div className="w-16 h-16 bg-surface-container rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-h2 text-on-surface-variant/30" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-on-surface font-label-md text-sm">Photo #{photo.id}</div>
                            <div className="text-on-surface-variant text-xs">{photo.ceremony}</div>
                          </div>
                          <div className="flex items-center gap-sm">
                            {photo.favorites > 0 && <span className="text-pink-400 text-xs flex items-center gap-xs"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span></span>}
                            {photo.comments > 0 && <span className="text-primary text-xs flex items-center gap-xs"><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span> {photo.comments}</span>}
                            <motion.button
                              className={`px-sm py-xs rounded-lg text-xs font-label-md ${photo.selected ? 'bg-secondary text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                              onClick={e => { e.stopPropagation(); toggleSelected(photo.id); }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {photo.selected ? 'Selected' : 'Select'}
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Expanded photo modal */}
        <AnimatePresence>
          {expandedPhoto && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExpandedPhoto(null)}>
              <motion.div className="bg-surface-container rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                <div className="aspect-video bg-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-display text-on-surface-variant/20" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                </div>
                <div className="p-lg">
                  <div className="flex items-center justify-between mb-md">
                    <div>
                      <div className="font-display text-h3 text-on-surface">Photo #{expandedPhoto.id}</div>
                      <div className="text-on-surface-variant text-sm">{expandedPhoto.ceremony}</div>
                    </div>
                    <div className="flex gap-sm">
                      <motion.button
                        className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs ${expandedPhoto.selected ? 'bg-secondary text-on-primary-container' : 'glass-card border border-outline-variant/20 text-on-surface'}`}
                        onClick={() => { toggleSelected(expandedPhoto.id); setExpandedPhoto(p => ({ ...p, selected: !p.selected })); }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{expandedPhoto.selected ? 'check_circle' : 'radio_button_unchecked'}</span>
                        {expandedPhoto.selected ? 'Selected' : 'Select'}
                      </motion.button>
                      <motion.button
                        className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs ${expandedPhoto.favorites > 0 ? 'bg-pink-500 text-white' : 'glass-card border border-outline-variant/20 text-on-surface'}`}
                        onClick={() => { toggleFavorite(expandedPhoto.id); setExpandedPhoto(p => ({ ...p, favorites: p.favorites > 0 ? 0 : 1 })); }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: expandedPhoto.favorites > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        {expandedPhoto.favorites > 0 ? 'Favorited' : 'Favorite'}
                      </motion.button>
                    </div>
                  </div>
                  <div className="bg-surface-variant rounded-xl p-sm">
                    <input className="w-full bg-transparent text-on-surface text-sm outline-none placeholder:text-on-surface-variant" placeholder="Add a comment or note for the photographer..." />
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
