import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';

const TABS = ['Branding', 'Domain', 'Email', 'Gallery Style'];

export default function WhiteLabelBranding() {
  const [activeTab, setActiveTab] = useState('Branding');
  const [brand, setBrand] = useState({
    name: 'Sharma Studios',
    tagline: 'Capturing your most precious moments',
    primaryColor: '#7c3aed',
    accentColor: '#43e5b1',
    fontStyle: 'modern',
    watermark: true,
    logo: null,
  });
  const [domain, setDomain] = useState({ subdomain: 'sharma-studios', customDomain: '', verified: false });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setBrand(b => ({ ...b, [k]: v }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">White-Label Branding</h1>
          <div className="flex items-center gap-sm">
            <AnimatePresence>
              {saved && (
                <motion.div
                  className="flex items-center gap-xs text-secondary text-sm font-label-md"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Saved!
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md shadow-lg shadow-primary-container/25"
              onClick={save}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Save Changes
            </motion.button>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div className="border-b border-outline-variant/10 px-lg bg-background/60">
          <div className="flex gap-xs">
            {TABS.map(tab => (
              <motion.button
                key={tab}
                className={`py-sm px-md text-sm font-label-md relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="wl-tab" />}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="px-lg py-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            <AnimatePresence mode="wait">
              {activeTab === 'Branding' && (
                <motion.div key="branding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-md">
                  {/* Logo upload */}
                  <div className="glass-card p-lg rounded-2xl">
                    <h3 className="font-display text-h3 text-on-surface mb-md">Logo</h3>
                    <motion.div
                      className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-xl flex flex-col items-center gap-sm cursor-pointer"
                      whileHover={{ borderColor: 'rgba(124,58,237,0.5)', scale: 1.01 }}
                    >
                      <span className="material-symbols-outlined text-h1 text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>add_photo_alternate</span>
                      <span className="text-on-surface-variant text-sm font-label-md">Upload your logo</span>
                      <span className="text-on-surface-variant text-xs">SVG, PNG — max 2MB</span>
                    </motion.div>
                  </div>

                  <div className="glass-card p-lg rounded-2xl space-y-md">
                    <h3 className="font-display text-h3 text-on-surface">Brand Details</h3>
                    {[
                      { key: 'name', label: 'Studio / Business Name' },
                      { key: 'tagline', label: 'Tagline' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-on-surface-variant text-sm font-label-md mb-xs">{f.label}</label>
                        <input
                          value={brand[f.key]}
                          onChange={e => set(f.key, e.target.value)}
                          className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none"
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Primary Color</label>
                        <div className="flex items-center gap-sm">
                          <input type="color" value={brand.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                          <input value={brand.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-sm text-on-surface text-sm font-mono outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Accent Color</label>
                        <div className="flex items-center gap-sm">
                          <input type="color" value={brand.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                          <input value={brand.accentColor} onChange={e => set('accentColor', e.target.value)} className="flex-1 bg-surface-container border border-outline-variant/20 rounded-xl px-sm py-sm text-on-surface text-sm font-mono outline-none" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-sm">Font Style</label>
                      <div className="flex gap-sm">
                        {[
                          { id: 'modern', label: 'Modern', font: 'font-sans' },
                          { id: 'classic', label: 'Classic', font: 'font-serif' },
                          { id: 'bold', label: 'Bold', font: 'font-display' },
                        ].map(s => (
                          <motion.button
                            key={s.id}
                            className={`flex-1 py-sm rounded-xl text-sm border ${brand.fontStyle === s.id ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20'} ${s.font}`}
                            onClick={() => set('fontStyle', s.id)}
                            whileHover={{ scale: 1.02 }}
                          >
                            {s.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-on-surface font-label-md text-sm">Remove Eventra Watermark</div>
                        <div className="text-on-surface-variant text-xs">Galleries appear fully under your brand</div>
                      </div>
                      <motion.div
                        className={`w-12 h-6 rounded-full relative cursor-pointer ${brand.watermark ? 'bg-primary-container' : 'bg-surface-variant'}`}
                        onClick={() => set('watermark', !brand.watermark)}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                          animate={{ left: brand.watermark ? '26px' : '2px' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'Domain' && (
                <motion.div key="domain" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-md">
                  <div className="glass-card p-lg rounded-2xl space-y-md">
                    <h3 className="font-display text-h3 text-on-surface">Subdomain</h3>
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Your Gallery URL</label>
                      <div className="flex items-center gap-xs bg-surface-container border border-outline-variant/20 rounded-xl overflow-hidden">
                        <input
                          value={domain.subdomain}
                          onChange={e => setDomain(d => ({ ...d, subdomain: e.target.value }))}
                          className="flex-1 px-md py-sm text-on-surface text-sm bg-transparent outline-none"
                        />
                        <span className="px-md py-sm text-on-surface-variant text-sm bg-surface-variant border-l border-outline-variant/20">.Eventra.ai</span>
                      </div>
                    </div>
                    <div className="text-secondary text-sm flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {domain.subdomain}.Eventra.ai is available
                    </div>
                  </div>

                  <div className="glass-card p-lg rounded-2xl space-y-md">
                    <h3 className="font-display text-h3 text-on-surface">Custom Domain</h3>
                    <p className="text-on-surface-variant text-sm">Use your own domain (e.g., gallery.yoursite.com). Requires a DNS CNAME record.</p>
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Custom Domain</label>
                      <input
                        value={domain.customDomain}
                        onChange={e => setDomain(d => ({ ...d, customDomain: e.target.value }))}
                        placeholder="gallery.yourstudio.com"
                        className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none"
                      />
                    </div>
                    {domain.customDomain && (
                      <div className="bg-surface-container rounded-xl p-md">
                        <div className="text-on-surface font-label-md text-sm mb-sm">DNS Configuration</div>
                        <div className="font-mono text-xs text-on-surface-variant bg-background rounded-lg p-sm">
                          Type: CNAME<br />
                          Name: gallery<br />
                          Value: cname.Eventra.ai<br />
                          TTL: 3600
                        </div>
                      </div>
                    )}
                    <motion.button className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md text-sm" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Verify Domain
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {(activeTab === 'Email' || activeTab === 'Gallery Style') && (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-md">
                  <div className="glass-card p-lg rounded-2xl text-center py-2xl">
                    <span className="material-symbols-outlined text-h1 text-primary mb-md block" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {activeTab === 'Email' ? 'mail' : 'palette'}
                    </span>
                    <h3 className="font-display text-h3 text-on-surface mb-sm">{activeTab} Settings</h3>
                    <p className="text-on-surface-variant text-sm">Configure {activeTab.toLowerCase()} branding options for your galleries and notifications.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Preview */}
            <div className="sticky top-24">
              <h3 className="font-display text-h3 text-on-surface mb-md">Brand Preview</h3>
              <motion.div
                className="rounded-3xl overflow-hidden shadow-2xl"
                style={{ boxShadow: `0 20px 50px ${brand.primaryColor}30` }}
                animate={{ boxShadow: `0 20px 50px ${brand.primaryColor}30` }}
              >
                {/* Mock gallery header */}
                <div className="px-md py-sm flex items-center justify-between" style={{ backgroundColor: brand.primaryColor }}>
                  <div className="flex items-center gap-sm">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <span className="text-white font-bold text-sm">{brand.name || 'Your Studio'}</span>
                  </div>
                  <span className="text-white/70 text-xs">{brand.tagline}</span>
                </div>
                <div className="bg-[#0f0a1a] p-md">
                  <div className="grid grid-cols-3 gap-xs mb-md">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/20" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>image</span>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    className="w-full py-sm rounded-xl text-white font-label-md text-sm"
                    style={{ backgroundColor: brand.accentColor }}
                    whileHover={{ scale: 1.02 }}
                  >
                    Download All Photos
                  </motion.button>
                  {!brand.watermark && (
                    <p className="text-white/20 text-xs text-center mt-sm">© {brand.name}</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
