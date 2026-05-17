import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const navGroups = [
  {
    label: 'Events',
    items: [
      { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
      { icon: 'event', label: 'Events', href: '/eventhub' },
      { icon: 'event_note', label: 'Sub-Events', href: '/subevents' },
      { icon: 'qr_code', label: 'QR Codes', href: '/qrcodes' },
      { icon: 'live_tv', label: 'Live Slideshow', href: '/slideshow' },
    ],
  },
  {
    label: 'Media',
    items: [
      { icon: 'photo_library', label: 'Media Library', href: '/medialibrary' },
      { icon: 'cloud_sync', label: 'Camera2Cloud', href: '/camera2cloudsetup' },
      { icon: 'face_6', label: 'AI Face Rec.', href: '/aifacerecognitionhub' },
      { icon: 'auto_fix_high', label: 'AI Editing', href: '/aiphotoediting' },
      { icon: 'check_circle', label: 'Client Proofing', href: '/clientproofing' },
    ],
  },
  {
    label: 'Guests',
    items: [
      { icon: 'group', label: 'Guests', href: '/guestmanagement' },
      { icon: 'chat', label: 'WhatsApp Bot', href: '/whatsappbotconfig' },
      { icon: 'mail', label: 'Invite Builder', href: '/invitebuilder' },
      { icon: 'photo_album', label: 'Guest Gallery', href: '/guestgallery' },
    ],
  },
  {
    label: 'Business',
    items: [
      { icon: 'palette', label: 'White Label', href: '/whitelabelbranding' },
      { icon: 'shopping_bag', label: 'Print Store', href: '/printstore' },
      { icon: 'analytics', label: 'Analytics', href: '/analytics' },
      { icon: 'people', label: 'Team', href: '/team' },
      { icon: 'storage', label: 'Storage', href: '/storage' },
    ],
  },
];

const navItems = navGroups.flatMap(g => g.items);

const bottomItems = [
  { icon: 'settings', label: 'Settings', href: '/dashboard' },
  { icon: 'help', label: 'Help', href: '/contactbookdemo' },
];

export default function AppSidebar({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 h-screen bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col z-40 overflow-hidden"
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10 min-h-[72px]">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-7 h-7 bg-primary-container rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <div className="font-display text-base font-bold text-primary leading-tight">Eventra</div>
                  <div className="text-xs text-on-surface-variant">Pro Plan</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            whileTap={{ scale: 0.9 }}
          >
            <span className="material-symbols-outlined text-sm">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden space-y-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    className="px-3 pt-2 pb-1 text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    {group.label}
                  </motion.div>
                )}
              </AnimatePresence>
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <motion.div
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl font-label-md text-label-md transition-colors cursor-pointer relative ${
                        isActive
                          ? 'bg-primary-container text-on-primary-container shadow-md shadow-primary-container/20'
                          : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                      }`}
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      title={collapsed ? item.label : ''}
                    >
                      <span
                        className="material-symbols-outlined text-lg flex-shrink-0"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {item.icon}
                      </span>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15 }}
                            className="whitespace-nowrap text-sm"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && !collapsed && (
                        <motion.div
                          className="absolute right-3 w-1.5 h-1.5 bg-on-primary-container rounded-full"
                          layoutId="active-dot"
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-outline-variant/10 space-y-1">
          {bottomItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-lg flex-shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          ))}

          {/* Storage usage */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="mt-3 p-3 glass-card rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                  <span>Storage</span>
                  <span className="text-primary">450 / 1000 GB</span>
                </div>
                <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-container to-secondary-container rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User avatar */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex-shrink-0 flex items-center justify-center text-xs font-bold text-on-primary-container">
              SA
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-xs font-bold text-on-surface">Studio Account</div>
                  <div className="text-xs text-on-surface-variant">Pro Plan</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main
        className="flex-1 transition-all duration-300 min-h-screen"
        style={{ marginLeft: collapsed ? 68 : 240 }}
      >
        {children}
      </main>
    </div>
  );
}
