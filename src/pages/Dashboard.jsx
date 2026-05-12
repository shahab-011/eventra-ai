import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer, viewport } from '../utils/animations';

function Counter({ target, suffix = '', prefix = '' }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1800, bounce: 0 });
  const [display, setDisplay] = React.useState(0);
  useEffect(() => { if (inView) mv.set(target); }, [inView, target]);
  useEffect(() => spring.on('change', v => setDisplay(Math.round(v))), [spring]);
  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

const recentEvents = [
  { id: 1, name: 'Sharma Wedding', date: 'May 18, 2026', type: 'Wedding', guests: 842, media: 3240, status: 'active', cover: null },
  { id: 2, name: 'TechCorp Annual Meet', date: 'May 25, 2026', type: 'Corporate', guests: 320, media: 1180, status: 'upcoming', cover: null },
  { id: 3, name: 'IIT Bombay Convocation', date: 'May 12, 2026', type: 'College', guests: 1540, media: 7800, status: 'completed', cover: null },
  { id: 4, name: 'Gupta Birthday Bash', date: 'Jun 2, 2026', type: 'Birthday', guests: 120, media: 0, status: 'draft', cover: null },
  { id: 5, name: 'Kapoor Reception', date: 'Jun 8, 2026', type: 'Wedding', guests: 600, media: 0, status: 'upcoming', cover: null },
];

const activity = [
  { icon: 'cloud_upload', text: '3,240 photos uploaded to Sharma Wedding', time: '2 min ago', color: 'text-secondary' },
  { icon: 'face_6', text: 'AI matched 842 faces in IIT Bombay gallery', time: '18 min ago', color: 'text-primary' },
  { icon: 'chat', text: '127 guests received photos via WhatsApp', time: '1 hr ago', color: 'text-[#25D366]' },
  { icon: 'person_add', text: '45 new RSVPs for TechCorp Annual Meet', time: '3 hrs ago', color: 'text-secondary' },
  { icon: 'star', text: 'New 5-star review from Kapoor family', time: '5 hrs ago', color: 'text-yellow-400' },
];

const statusColors = {
  active: 'bg-secondary/15 text-secondary border-secondary/20',
  upcoming: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-surface-variant text-on-surface-variant border-outline-variant/30',
  draft: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
};

export default function Dashboard() {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              placeholder="Search events, guests, media..."
              className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-10 pr-md py-xs text-on-surface placeholder-outline text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-sm">
            <motion.button className="w-9 h-9 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
            </motion.button>
            <motion.button className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <span className="font-bold text-on-primary-container text-sm">S</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="px-lg py-lg max-w-[1400px] mx-auto">
          {/* Greeting */}
          <motion.div className="mb-lg" variants={staggerContainer(0.1)} initial="hidden" animate="visible">
            <motion.h1 variants={fadeInUp} className="font-display text-h1 text-on-surface">
              {greeting}, Shahab 👋
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-on-surface-variant mt-xs">
              You have <span className="text-primary font-label-md">2 active events</span> this week. Here's your overview.
            </motion.p>
          </motion.div>

          {/* Metric cards */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg"
            variants={staggerContainer(0.08)}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: 'Active Events', value: 2, suffix: '', icon: 'event', color: 'from-primary-container/20 to-primary-container/5', iconColor: 'text-primary', trend: '+1 this week' },
              { label: 'Total Media', value: 12220, suffix: '', icon: 'photo_library', color: 'from-secondary-container/20 to-secondary-container/5', iconColor: 'text-secondary', trend: '+3,240 today' },
              { label: 'Guests This Month', value: 2822, suffix: '', icon: 'group', color: 'from-primary-container/20 to-primary-container/5', iconColor: 'text-primary', trend: '+127 via WhatsApp' },
              { label: 'Storage Used', value: 68, suffix: '%', icon: 'storage', color: 'from-secondary-container/20 to-secondary-container/5', iconColor: 'text-secondary', trend: '34 GB of 50 GB' },
            ].map((m, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className={`glass-card p-md rounded-2xl bg-gradient-to-br ${m.color} relative overflow-hidden group`}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="flex items-start justify-between mb-sm">
                  <div className={`w-10 h-10 rounded-xl bg-surface-container/50 flex items-center justify-center ${m.iconColor}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                  </div>
                  <span className="text-on-surface-variant text-xs">{m.trend}</span>
                </div>
                <div className="font-display text-h1 text-on-surface">
                  <Counter target={m.value} suffix={m.suffix} />
                </div>
                <div className="text-on-surface-variant text-sm font-label-md mt-xs">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-lg">
            {/* Events grid */}
            <div className="xl:col-span-2">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-display text-h2 text-on-surface">Your Events</h2>
                <Link to="/eventhub">
                  <motion.button className="text-primary font-label-md text-sm flex items-center gap-xs" whileHover={{ x: 3 }}>
                    View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </motion.button>
                </Link>
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-md"
                variants={staggerContainer(0.07)}
                initial="hidden"
                animate="visible"
              >
                {/* Create new card */}
                <motion.div variants={fadeInUp}>
                  <Link to="/createevent">
                    <motion.div
                      className="glass-card rounded-2xl border-2 border-dashed border-outline-variant/30 p-md flex flex-col items-center justify-center gap-sm cursor-pointer group h-[180px]"
                      whileHover={{ scale: 1.02, borderColor: 'rgba(124,58,237,0.5)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="w-12 h-12 bg-primary-container/15 rounded-2xl flex items-center justify-center group-hover:bg-primary-container/30 transition-colors"
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="material-symbols-outlined text-primary text-h2">add</span>
                      </motion.div>
                      <span className="font-display text-base text-on-surface">Create New Event</span>
                      <span className="text-on-surface-variant text-xs">Wedding, corporate, college & more</span>
                    </motion.div>
                  </Link>
                </motion.div>

                {/* Event cards */}
                {recentEvents.slice(0, 5).map((ev) => (
                  <motion.div
                    key={ev.id}
                    variants={fadeInUp}
                    onHoverStart={() => setHoveredEvent(ev.id)}
                    onHoverEnd={() => setHoveredEvent(null)}
                  >
                    <Link to="/eventhub">
                      <motion.div
                        className="glass-card rounded-2xl p-md relative overflow-hidden cursor-pointer h-[180px] flex flex-col justify-between"
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent" />

                        <div className="relative">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-display text-base text-on-surface">{ev.name}</h3>
                              <div className="text-on-surface-variant text-xs mt-xs flex items-center gap-xs">
                                <span className="material-symbols-outlined text-xs">calendar_today</span>
                                {ev.date}
                              </div>
                            </div>
                            <span className={`text-xs px-sm py-xs rounded-full border font-label-md ${statusColors[ev.status]}`}>
                              {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="flex items-center justify-between text-xs text-on-surface-variant mb-sm">
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-xs">group</span>
                              {ev.guests.toLocaleString()} guests
                            </span>
                            <span className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-xs">photo_library</span>
                              {ev.media.toLocaleString()} media
                            </span>
                          </div>
                          <AnimatePresence>
                            {hoveredEvent === ev.id && (
                              <motion.div
                                className="flex gap-xs"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                              >
                                <motion.button className="flex-1 bg-primary-container text-on-primary-container text-xs py-xs rounded-lg font-label-md" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                  Open
                                </motion.button>
                                <motion.button className="w-8 bg-surface-variant text-on-surface-variant text-xs rounded-lg flex items-center justify-center" whileHover={{ scale: 1.03 }}>
                                  <span className="material-symbols-outlined text-xs">more_vert</span>
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right sidebar widgets */}
            <div className="space-y-md">
              {/* Storage widget */}
              <motion.div
                className="glass-card p-md rounded-2xl"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h3 className="font-display text-h3 text-on-surface mb-md">Storage</h3>
                <div className="flex items-center justify-between text-sm mb-sm">
                  <span className="text-on-surface-variant">34 GB used</span>
                  <span className="text-on-surface font-label-md">50 GB</span>
                </div>
                <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden mb-sm">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-container to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: '68%' }}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-xs text-center">
                  {[
                    { label: 'Photos', pct: '48%', color: 'bg-primary-container' },
                    { label: 'Videos', pct: '35%', color: 'bg-secondary' },
                    { label: 'Other', pct: '17%', color: 'bg-outline-variant' },
                  ].map((s, i) => (
                    <div key={i} className="p-xs bg-surface-container rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${s.color} mx-auto mb-xs`} />
                      <div className="text-xs text-on-surface font-label-md">{s.pct}</div>
                      <div className="text-xs text-on-surface-variant">{s.label}</div>
                    </div>
                  ))}
                </div>
                <motion.button
                  className="w-full mt-md bg-surface-container border border-outline-variant/20 text-on-surface-variant text-sm py-xs rounded-xl font-label-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Upgrade Storage
                </motion.button>
              </motion.div>

              {/* Activity feed */}
              <motion.div
                className="glass-card p-md rounded-2xl"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-md">
                  <h3 className="font-display text-h3 text-on-surface">Recent Activity</h3>
                  <div className="flex items-center gap-xs">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
                    <span className="text-xs text-on-surface-variant">Live</span>
                  </div>
                </div>
                <div className="space-y-sm">
                  {activity.map((a, i) => (
                    <motion.div
                      key={i}
                      className="flex items-start gap-sm"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className={`material-symbols-outlined text-sm ${a.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-on-surface text-xs leading-relaxed">{a.text}</p>
                        <p className="text-on-surface-variant text-xs mt-xs">{a.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                className="glass-card p-md rounded-2xl"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h3 className="font-display text-h3 text-on-surface mb-md">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-sm">
                  {[
                    { icon: 'cloud_upload', label: 'Upload Media', href: '/medialibrary', color: 'text-secondary' },
                    { icon: 'face_6', label: 'Run AI Match', href: '/aifacerecognitionhub', color: 'text-primary' },
                    { icon: 'chat', label: 'WhatsApp Bot', href: '/whatsappbotconfig', color: 'text-[#25D366]' },
                    { icon: 'analytics', label: 'Analytics', href: '/analytics', color: 'text-primary' },
                  ].map((q, i) => (
                    <Link to={q.href} key={i}>
                      <motion.div
                        className="bg-surface-container border border-outline-variant/20 rounded-xl p-sm flex flex-col items-center gap-xs cursor-pointer"
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(124,58,237,0.08)' }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className={`material-symbols-outlined ${q.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{q.icon}</span>
                        <span className="text-on-surface-variant text-xs font-label-md text-center">{q.label}</span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
