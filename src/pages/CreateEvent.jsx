import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';

const STEPS = ['Basic Info', 'Sub-Events', 'Co-hosts', 'Privacy', 'Review'];

const eventTypes = [
  { id: 'wedding', icon: 'favorite', label: 'Wedding', color: 'from-rose-500/20 to-rose-500/5' },
  { id: 'corporate', icon: 'business_center', label: 'Corporate', color: 'from-primary-container/20 to-primary-container/5' },
  { id: 'college', icon: 'school', label: 'College / Fest', color: 'from-secondary-container/20 to-secondary-container/5' },
  { id: 'birthday', icon: 'celebration', label: 'Birthday', color: 'from-yellow-400/20 to-yellow-400/5' },
  { id: 'conference', icon: 'mic', label: 'Conference', color: 'from-primary-container/20 to-primary-container/5' },
  { id: 'other', icon: 'more_horiz', label: 'Other', color: 'from-outline-variant/20 to-outline-variant/5' },
];

const privacyOptions = [
  { id: 'public', icon: 'public', label: 'Public', desc: 'Anyone with the link can view and download' },
  { id: 'protected', icon: 'lock_open', label: 'Password Protected', desc: 'Guests need a password to access the gallery' },
  { id: 'private', icon: 'lock', label: 'Private (Invite Only)', desc: 'Only invited guests can access via selfie or code' },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', type: '', date: '', endDate: '', venue: '', city: '',
    expectedGuests: '', description: '',
    subEvents: [{ name: '', date: '', time: '' }],
    cohosts: [{ name: '', email: '', role: 'Photographer' }],
    privacy: 'protected',
    password: '',
    whatsappEnabled: true,
    aiEnabled: true,
    camera2cloudEnabled: true,
  });
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSubEvent = () => set('subEvents', [...form.subEvents, { name: '', date: '', time: '' }]);
  const updateSubEvent = (i, k, v) => {
    const arr = [...form.subEvents];
    arr[i] = { ...arr[i], [k]: v };
    set('subEvents', arr);
  };
  const removeSubEvent = (i) => set('subEvents', form.subEvents.filter((_, idx) => idx !== i));

  const addCohost = () => set('cohosts', [...form.cohosts, { name: '', email: '', role: 'Photographer' }]);
  const updateCohost = (i, k, v) => {
    const arr = [...form.cohosts];
    arr[i] = { ...arr[i], [k]: v };
    set('cohosts', arr);
  };
  const removeCohost = (i) => set('cohosts', form.cohosts.filter((_, idx) => idx !== i));

  const inputCls = 'w-full bg-surface-container border border-outline-variant/30 rounded-xl px-md py-sm text-on-surface placeholder-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm';

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center gap-md"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Link to="/dashboard">
            <motion.button className="w-9 h-9 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_back</span>
            </motion.button>
          </Link>
          <h1 className="font-display text-h2 text-on-surface">Create New Event</h1>
        </motion.div>

        <div className="max-w-3xl mx-auto px-lg py-lg">
          {/* Step indicator */}
          {!done && (
            <motion.div
              className="flex items-center gap-xs mb-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {STEPS.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-xs">
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${i <= step ? 'bg-primary-container text-on-primary-container shadow-md shadow-primary-container/30' : 'bg-surface-variant text-on-surface-variant'}`}
                      animate={{ scale: i === step ? 1.1 : 1 }}
                      onClick={() => i < step && setStep(i)}
                    >
                      {i < step ? <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : i + 1}
                    </motion.div>
                    <span className={`text-xs font-label-md hidden md:block ${i === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px transition-all duration-500 ${i < step ? 'bg-primary-container' : 'bg-outline-variant/20'}`} />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                className="text-center py-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-28 h-28 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-lg border border-secondary-container/30"
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}>celebration</span>
                </motion.div>
                <h2 className="font-display text-h1 text-on-surface mb-sm">Event Created!</h2>
                <p className="text-on-surface-variant mb-xl max-w-sm mx-auto">
                  <strong className="text-on-surface">{form.name}</strong> is live. Share the link with your guests or go to your event hub to manage it.
                </p>
                <div className="flex flex-col sm:flex-row gap-md justify-center">
                  <Link to="/eventhub">
                    <motion.button className="bg-primary-container text-on-primary-container px-xl py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      Go to Event Hub →
                    </motion.button>
                  </Link>
                  <motion.button
                    className="glass-card border border-outline-variant/20 text-on-surface px-xl py-sm rounded-xl font-label-md"
                    onClick={() => { setDone(false); setStep(0); setForm({ name: '', type: '', date: '', endDate: '', venue: '', city: '', expectedGuests: '', description: '', subEvents: [{ name: '', date: '', time: '' }], cohosts: [{ name: '', email: '', role: 'Photographer' }], privacy: 'protected', password: '', whatsappEnabled: true, aiEnabled: true, camera2cloudEnabled: true }); }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    Create Another
                  </motion.button>
                </div>
              </motion.div>
            ) : step === 0 ? (
              <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="glass-card p-lg rounded-2xl space-y-lg">
                  <div>
                    <h2 className="font-display text-h2 text-on-surface mb-xs">Basic Information</h2>
                    <p className="text-on-surface-variant text-sm">Tell us about your event.</p>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant text-sm font-label-md mb-sm">Event Type</label>
                    <div className="grid grid-cols-3 gap-sm">
                      {eventTypes.map((t) => (
                        <motion.div
                          key={t.id}
                          className={`bg-gradient-to-br ${t.color} border-2 rounded-xl p-sm cursor-pointer text-center transition-all ${form.type === t.id ? 'border-primary-container' : 'border-transparent'}`}
                          onClick={() => set('type', t.id)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className={`material-symbols-outlined block mb-xs ${form.type === t.id ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                          <span className={`text-xs font-label-md ${form.type === t.id ? 'text-primary' : 'text-on-surface-variant'}`}>{t.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Event Name <span className="text-primary">*</span></label>
                    <input className={inputCls} placeholder="e.g., Sharma-Verma Wedding" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Start Date <span className="text-primary">*</span></label>
                      <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">End Date</label>
                      <input type="date" className={inputCls} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-md">
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Venue</label>
                      <input className={inputCls} placeholder="Venue name" value={form.venue} onChange={e => set('venue', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">City</label>
                      <input className={inputCls} placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Expected Guests</label>
                    <input type="number" className={inputCls} placeholder="500" value={form.expectedGuests} onChange={e => set('expectedGuests', e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Description (optional)</label>
                    <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Brief description of the event..." value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end mt-md">
                  <motion.button
                    className={`px-xl py-sm rounded-xl font-label-md transition-all ${form.name && form.type && form.date ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/25' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}
                    onClick={() => form.name && form.type && form.date && setStep(1)}
                    whileHover={form.name ? { scale: 1.02 } : {}}
                    whileTap={form.name ? { scale: 0.98 } : {}}
                  >
                    Continue →
                  </motion.button>
                </div>
              </motion.div>

            ) : step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="glass-card p-lg rounded-2xl space-y-md">
                  <div>
                    <h2 className="font-display text-h2 text-on-surface mb-xs">Sub-Events</h2>
                    <p className="text-on-surface-variant text-sm">Add sub-events like Mehendi, Sangeet, Reception. Guests can RSVP to specific functions.</p>
                  </div>
                  {form.subEvents.map((se, i) => (
                    <motion.div
                      key={i}
                      className="bg-surface-container rounded-xl p-md space-y-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-sm text-primary">Function {i + 1}</span>
                        {form.subEvents.length > 1 && (
                          <motion.button onClick={() => removeSubEvent(i)} className="text-on-surface-variant hover:text-error text-xs flex items-center gap-xs" whileHover={{ scale: 1.05 }}>
                            <span className="material-symbols-outlined text-xs">delete</span> Remove
                          </motion.button>
                        )}
                      </div>
                      <input className={inputCls} placeholder="e.g., Mehendi Ceremony" value={se.name} onChange={e => updateSubEvent(i, 'name', e.target.value)} />
                      <div className="grid grid-cols-2 gap-sm">
                        <input type="date" className={inputCls} value={se.date} onChange={e => updateSubEvent(i, 'date', e.target.value)} />
                        <input type="time" className={inputCls} value={se.time} onChange={e => updateSubEvent(i, 'time', e.target.value)} />
                      </div>
                    </motion.div>
                  ))}
                  <motion.button
                    onClick={addSubEvent}
                    className="w-full py-sm rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant font-label-md text-sm flex items-center justify-center gap-sm"
                    whileHover={{ borderColor: 'rgba(124,58,237,0.4)', color: 'var(--color-primary)' }}
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Add Sub-Event
                  </motion.button>
                </div>
                <div className="flex justify-between mt-md">
                  <motion.button className="text-on-surface-variant text-sm font-label-md flex items-center gap-xs" onClick={() => setStep(0)} whileHover={{ x: -3 }}>
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </motion.button>
                  <motion.button className="px-xl py-sm rounded-xl bg-primary-container text-on-primary-container font-label-md shadow-lg shadow-primary-container/25" onClick={() => setStep(2)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Continue →
                  </motion.button>
                </div>
              </motion.div>

            ) : step === 2 ? (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="glass-card p-lg rounded-2xl space-y-md">
                  <div>
                    <h2 className="font-display text-h2 text-on-surface mb-xs">Co-hosts & Team</h2>
                    <p className="text-on-surface-variant text-sm">Add photographers, assistants, or co-organizers who can upload and manage this event.</p>
                  </div>
                  {form.cohosts.map((ch, i) => (
                    <motion.div
                      key={i}
                      className="bg-surface-container rounded-xl p-md space-y-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-sm text-primary">Member {i + 1}</span>
                        {form.cohosts.length > 1 && (
                          <motion.button onClick={() => removeCohost(i)} className="text-on-surface-variant hover:text-error text-xs flex items-center gap-xs" whileHover={{ scale: 1.05 }}>
                            <span className="material-symbols-outlined text-xs">delete</span> Remove
                          </motion.button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-sm">
                        <input className={inputCls} placeholder="Name" value={ch.name} onChange={e => updateCohost(i, 'name', e.target.value)} />
                        <input type="email" className={inputCls} placeholder="email@example.com" value={ch.email} onChange={e => updateCohost(i, 'email', e.target.value)} />
                      </div>
                      <select className={inputCls} value={ch.role} onChange={e => updateCohost(i, 'role', e.target.value)}>
                        {['Photographer', 'Assistant', 'Co-organizer', 'Videographer', 'View Only'].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </motion.div>
                  ))}
                  <motion.button
                    onClick={addCohost}
                    className="w-full py-sm rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant font-label-md text-sm flex items-center justify-center gap-sm"
                    whileHover={{ borderColor: 'rgba(124,58,237,0.4)' }}
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Add Team Member
                  </motion.button>
                </div>
                <div className="flex justify-between mt-md">
                  <motion.button className="text-on-surface-variant text-sm font-label-md flex items-center gap-xs" onClick={() => setStep(1)} whileHover={{ x: -3 }}>
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </motion.button>
                  <motion.button className="px-xl py-sm rounded-xl bg-primary-container text-on-primary-container font-label-md shadow-lg shadow-primary-container/25" onClick={() => setStep(3)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Continue →
                  </motion.button>
                </div>
              </motion.div>

            ) : step === 3 ? (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="glass-card p-lg rounded-2xl space-y-lg">
                  <div>
                    <h2 className="font-display text-h2 text-on-surface mb-xs">Privacy & Access</h2>
                    <p className="text-on-surface-variant text-sm">Control who can view and download photos from this event.</p>
                  </div>
                  <div className="space-y-sm">
                    {privacyOptions.map((p) => (
                      <motion.div
                        key={p.id}
                        className={`p-md rounded-xl border-2 cursor-pointer flex items-start gap-md transition-all ${form.privacy === p.id ? 'border-primary-container bg-primary-container/8' : 'border-outline-variant/20 bg-surface-container'}`}
                        onClick={() => set('privacy', p.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${form.privacy === p.id ? 'bg-primary-container' : 'bg-surface-variant'}`}>
                          <span className={`material-symbols-outlined ${form.privacy === p.id ? 'text-on-primary-container' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                        </div>
                        <div>
                          <div className={`font-label-md text-sm ${form.privacy === p.id ? 'text-primary' : 'text-on-surface'}`}>{p.label}</div>
                          <div className="text-on-surface-variant text-xs mt-xs">{p.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {form.privacy === 'protected' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-on-surface-variant text-sm font-label-md mb-xs">Gallery Password</label>
                      <input type="password" className={inputCls} placeholder="Set a password for guests" value={form.password} onChange={e => set('password', e.target.value)} />
                    </motion.div>
                  )}
                  <div className="space-y-sm border-t border-outline-variant/10 pt-md">
                    <h3 className="font-label-md text-sm text-on-surface">Platform Features</h3>
                    {[
                      { key: 'whatsappEnabled', icon: 'chat', label: 'WhatsApp Photo Delivery', color: 'text-[#25D366]' },
                      { key: 'aiEnabled', icon: 'face_6', label: 'AI Face Recognition', color: 'text-primary' },
                      { key: 'camera2cloudEnabled', icon: 'cloud_sync', label: 'Camera2Cloud Real-time Upload', color: 'text-secondary' },
                    ].map((feat) => (
                      <div key={feat.key} className="flex items-center justify-between p-sm bg-surface-container rounded-xl">
                        <div className="flex items-center gap-sm">
                          <span className={`material-symbols-outlined text-sm ${feat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{feat.icon}</span>
                          <span className="text-on-surface text-sm">{feat.label}</span>
                        </div>
                        <motion.button
                          className={`w-12 h-6 rounded-full transition-colors relative ${form[feat.key] ? 'bg-primary-container' : 'bg-surface-variant'}`}
                          onClick={() => set(feat.key, !form[feat.key])}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                            animate={{ left: form[feat.key] ? '26px' : '2px' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-md">
                  <motion.button className="text-on-surface-variant text-sm font-label-md flex items-center gap-xs" onClick={() => setStep(2)} whileHover={{ x: -3 }}>
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </motion.button>
                  <motion.button className="px-xl py-sm rounded-xl bg-primary-container text-on-primary-container font-label-md shadow-lg shadow-primary-container/25" onClick={() => setStep(4)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Review →
                  </motion.button>
                </div>
              </motion.div>

            ) : (
              <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <div className="glass-card p-lg rounded-2xl space-y-md">
                  <div>
                    <h2 className="font-display text-h2 text-on-surface mb-xs">Review & Publish</h2>
                    <p className="text-on-surface-variant text-sm">Everything looks good? Go live and start uploading memories.</p>
                  </div>
                  <div className="space-y-sm">
                    {[
                      { label: 'Event Name', value: form.name },
                      { label: 'Type', value: form.type ? form.type.charAt(0).toUpperCase() + form.type.slice(1) : '—' },
                      { label: 'Date', value: form.date || '—' },
                      { label: 'Venue', value: form.venue ? `${form.venue}, ${form.city}` : '—' },
                      { label: 'Expected Guests', value: form.expectedGuests || '—' },
                      { label: 'Sub-Events', value: `${form.subEvents.filter(s => s.name).length} added` },
                      { label: 'Team Members', value: `${form.cohosts.filter(c => c.name).length} added` },
                      { label: 'Privacy', value: privacyOptions.find(p => p.id === form.privacy)?.label },
                      { label: 'WhatsApp Delivery', value: form.whatsappEnabled ? 'Enabled' : 'Disabled' },
                      { label: 'AI Face Recognition', value: form.aiEnabled ? 'Enabled' : 'Disabled' },
                      { label: 'Camera2Cloud', value: form.camera2cloudEnabled ? 'Enabled' : 'Disabled' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-xs border-b border-outline-variant/10 last:border-0">
                        <span className="text-on-surface-variant text-sm">{row.label}</span>
                        <span className="text-on-surface text-sm font-label-md">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-md">
                  <motion.button className="text-on-surface-variant text-sm font-label-md flex items-center gap-xs" onClick={() => setStep(3)} whileHover={{ x: -3 }}>
                    <span className="material-symbols-outlined text-sm">arrow_back</span> Back
                  </motion.button>
                  <motion.button
                    className="px-xl py-sm rounded-xl bg-primary-container text-on-primary-container font-label-md shadow-lg shadow-primary-container/25 flex items-center gap-sm"
                    onClick={() => setDone(true)}
                    whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(124,58,237,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Publish Event
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppSidebar>
  );
}
