import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';

const TOOLS = [
  { id: 'enhance', icon: 'auto_awesome', label: 'AI Enhance', desc: 'Auto-fix exposure, sharpness & color' },
  { id: 'background', icon: 'blur_circular', label: 'BG Removal', desc: 'Remove or blur background' },
  { id: 'retouch', icon: 'face_retouching_natural', label: 'Skin Retouch', desc: 'Smooth skin & remove blemishes' },
  { id: 'upscale', icon: 'zoom_in', label: '4x Upscale', desc: 'Increase resolution with AI' },
  { id: 'colorize', icon: 'palette', label: 'Color Grade', desc: 'Apply cinematic color presets' },
  { id: 'denoise', icon: 'grain', label: 'Denoise', desc: 'Remove grain & noise' },
];

const PRESETS = [
  { name: 'Cinematic', style: 'from-yellow-400/20 to-orange-500/20' },
  { name: 'Moody', style: 'from-blue-500/20 to-purple-500/20' },
  { name: 'Warm', style: 'from-orange-400/20 to-red-400/20' },
  { name: 'Cool', style: 'from-cyan-400/20 to-blue-500/20' },
  { name: 'B&W', style: 'from-white/10 to-white/5' },
  { name: 'Vibrant', style: 'from-pink-400/20 to-purple-400/20' },
];

const FILMSTRIP = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }));

export default function AIPhotoEditing() {
  const [selectedTool, setSelectedTool] = useState('enhance');
  const [selectedPreset, setSelectedPreset] = useState('Cinematic');
  const [selectedPhoto, setSelectedPhoto] = useState(1);
  const [showBefore, setShowBefore] = useState(false);
  const [sliders, setSliders] = useState({ exposure: 50, contrast: 50, saturation: 60, warmth: 45, sharpness: 55 });
  const [processing, setProcessing] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const runTool = () => {
    setProcessing(true);
    setTimeout(() => setProcessing(false), 1800);
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">AI Photo Editing</h1>
          <div className="flex items-center gap-sm">
            <motion.button
              className={`px-md py-xs rounded-xl text-sm font-label-md flex items-center gap-xs border ${batchMode ? 'bg-primary-container text-on-primary-container border-primary-container/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/20'}`}
              onClick={() => setBatchMode(b => !b)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
              {batchMode ? 'Batch: ON' : 'Batch Edit'}
            </motion.button>
            <motion.button
              className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm">download</span> Export
            </motion.button>
          </div>
        </motion.div>

        {/* Editor layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: AI Tools */}
          <motion.div
            className="w-56 border-r border-outline-variant/10 bg-surface-container-lowest overflow-y-auto p-sm space-y-xs"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="px-sm py-xs">
              <span className="text-on-surface-variant text-xs font-label-md uppercase tracking-wider">AI Tools</span>
            </div>
            {TOOLS.map((tool) => (
              <motion.button
                key={tool.id}
                className={`w-full text-left px-sm py-sm rounded-xl flex items-center gap-sm transition-all ${selectedTool === tool.id ? 'bg-primary-container/15 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                onClick={() => setSelectedTool(tool.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedTool === tool.id ? 'bg-primary-container' : 'bg-surface-variant'}`}>
                  <span className={`material-symbols-outlined text-sm ${selectedTool === tool.id ? 'text-on-primary-container' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{tool.icon}</span>
                </div>
                <div>
                  <div className="text-xs font-label-md">{tool.label}</div>
                  <div className="text-xs text-on-surface-variant leading-tight">{tool.desc}</div>
                </div>
              </motion.button>
            ))}

            <div className="px-sm py-xs mt-md">
              <span className="text-on-surface-variant text-xs font-label-md uppercase tracking-wider">Presets</span>
            </div>
            {PRESETS.map((p) => (
              <motion.button
                key={p.name}
                className={`w-full text-left px-sm py-xs rounded-xl flex items-center gap-sm ${selectedPreset === p.name ? 'ring-1 ring-primary-container' : ''}`}
                onClick={() => setSelectedPreset(p.name)}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.style} border border-outline-variant/20 flex-shrink-0`} />
                <span className={`text-xs font-label-md ${selectedPreset === p.name ? 'text-primary' : 'text-on-surface-variant'}`}>{p.name}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Center: Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-lg">
              {/* Main canvas */}
              <motion.div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{ maxHeight: '70vh', aspectRatio: '3/2', width: '100%', maxWidth: '700px' }}
                animate={processing ? { filter: 'brightness(1.2) saturate(1.5)' } : { filter: 'brightness(1) saturate(1)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-secondary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/10" style={{ fontSize: 120, fontVariationSettings: "'FILL' 1" }}>image</span>
                </div>
                {processing && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {showBefore && (
                  <div className="absolute inset-0 bg-surface-container/80 flex items-center justify-center">
                    <span className="text-on-surface font-label-md">Before</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <motion.button
                    className={`px-sm py-xs rounded-lg text-xs font-label-md ${showBefore ? 'bg-surface-container text-on-surface' : 'bg-primary-container text-on-primary-container'}`}
                    onMouseDown={() => setShowBefore(true)}
                    onMouseUp={() => setShowBefore(false)}
                    onMouseLeave={() => setShowBefore(false)}
                  >
                    Hold: Before
                  </motion.button>
                </div>
              </motion.div>

              {/* Processing overlay */}
              <AnimatePresence>
                {processing && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="glass-card px-lg py-md rounded-2xl flex items-center gap-md">
                      <span className="material-symbols-outlined text-primary text-h2 animate-spin">sync</span>
                      <div>
                        <div className="font-label-md text-on-surface">Running AI Enhancement...</div>
                        <div className="text-on-surface-variant text-xs">This takes just a moment</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filmstrip */}
            <div className="h-20 bg-[#0a0a0a] border-t border-outline-variant/10 flex items-center gap-sm px-md overflow-x-auto">
              {FILMSTRIP.map((f) => (
                <motion.div
                  key={f.id}
                  className={`w-14 h-14 rounded-lg bg-white/5 flex-shrink-0 cursor-pointer overflow-hidden ${selectedPhoto === f.id ? 'ring-2 ring-primary-container' : ''}`}
                  onClick={() => setSelectedPhoto(f.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/20" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>image</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Adjustments */}
          <motion.div
            className="w-60 border-l border-outline-variant/10 bg-surface-container-lowest overflow-y-auto p-md space-y-md"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <span className="text-on-surface-variant text-xs font-label-md uppercase tracking-wider">Adjustments</span>
            </div>
            {Object.entries(sliders).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-xs">
                  <span className="text-on-surface-variant capitalize">{key}</span>
                  <span className="text-primary font-label-md">{val}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val}
                  onChange={e => setSliders(s => ({ ...s, [key]: Number(e.target.value) }))}
                  className="w-full accent-primary h-1"
                />
              </div>
            ))}
            <motion.button
              className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md text-sm flex items-center justify-center gap-xs shadow-lg shadow-primary-container/25 mt-md"
              onClick={runTool}
              disabled={processing}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Apply AI Enhancement
            </motion.button>
            <motion.button
              className="w-full bg-surface-container border border-outline-variant/20 text-on-surface-variant py-xs rounded-xl font-label-md text-sm"
              onClick={() => setSliders({ exposure: 50, contrast: 50, saturation: 60, warmth: 45, sharpness: 55 })}
              whileHover={{ scale: 1.02 }}
            >
              Reset
            </motion.button>
          </motion.div>
        </div>
      </div>
    </AppSidebar>
  );
}
