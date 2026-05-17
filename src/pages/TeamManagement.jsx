import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const ROLES = [
  { id: 'owner', label: 'Owner', icon: 'shield_person', color: 'text-primary bg-primary-container/15 border-primary-container/30', desc: 'Full access — billing, settings, delete', perms: ['All permissions'] },
  { id: 'admin', label: 'Admin', icon: 'manage_accounts', color: 'text-secondary bg-secondary/10 border-secondary/20', desc: 'Manage events, team, guests. No billing.', perms: ['Create/edit events', 'Manage guests', 'View analytics', 'Export media'] },
  { id: 'shooter', label: 'Photographer', icon: 'camera_alt', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', desc: 'Upload media, manage camera accounts.', perms: ['Upload media', 'Camera2Cloud access', 'View own uploads'] },
  { id: 'editor', label: 'Editor', icon: 'edit_note', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', desc: 'Edit and organise media in galleries.', perms: ['Edit/organise media', 'Apply AI edits', 'Download originals'] },
  { id: 'viewer', label: 'Viewer', icon: 'visibility', color: 'text-on-surface-variant bg-surface-variant/30 border-outline-variant/20', desc: 'View-only access to assigned events.', perms: ['View galleries', 'View analytics'] },
];

const INITIAL_TEAM = [
  { id: 1, name: 'Anupam Maurya', email: 'anupam@sharma-studios.com', role: 'owner', initials: 'AM', color: 'from-primary-container to-secondary-container', events: 'All', status: 'active', joined: 'Jan 2024', lastActive: 'Now' },
  { id: 2, name: 'Vikram Nair', email: 'vikram@sharma-studios.com', role: 'shooter', initials: 'VN', color: 'from-blue-500 to-indigo-500', events: 'All', status: 'active', joined: 'Mar 2024', lastActive: '3 hrs ago' },
  { id: 3, name: 'Prachi Mehta', email: 'prachi@sharma-studios.com', role: 'editor', initials: 'PM', color: 'from-amber-500 to-orange-500', events: 'All', status: 'active', joined: 'Mar 2024', lastActive: '1 day ago' },
  { id: 4, name: 'Rohan Das', email: 'rohan@sharma-studios.com', role: 'shooter', initials: 'RD', color: 'from-green-500 to-emerald-500', events: 'Sharma Wedding', status: 'active', joined: 'May 2024', lastActive: '2 hrs ago' },
  { id: 5, name: 'Sana Khan', email: 'sana@freelance.com', role: 'viewer', initials: 'SK', color: 'from-pink-500 to-rose-500', events: 'Sharma Wedding', status: 'pending', joined: '—', lastActive: 'Never' },
];

const CAMERA_ACCOUNTS = [
  { id: 1, name: 'Canon EOS R5 — Vikram', status: 'connected', lastUpload: '2 min ago', uploads: 3240 },
  { id: 2, name: 'Sony A7 IV — Rohan', status: 'connected', lastUpload: '5 min ago', uploads: 1180 },
  { id: 3, name: 'Nikon Z9 — Vikram (2nd body)', status: 'pairing', lastUpload: '—', uploads: 0 },
];

export default function TeamManagement() {
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'shooter', events: 'All' });
  const [activeTab, setActiveTab] = useState('team');
  const [showRoleModal, setShowRoleModal] = useState(null);
  const [inviteSent, setInviteSent] = useState(false);

  const getRoleConfig = (roleId) => ROLES.find(r => r.id === roleId) || ROLES[4];

  const sendInvite = () => {
    if (!invite.email) return;
    const names = invite.email.split('@')[0];
    setTeam(prev => [...prev, {
      id: Date.now(), name: names, email: invite.email, role: invite.role,
      initials: names.slice(0, 2).toUpperCase(), color: 'from-surface-variant to-surface-container',
      events: invite.events, status: 'pending', joined: '—', lastActive: 'Never',
    }]);
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setShowInvite(false); setInvite({ email: '', role: 'shooter', events: 'All' }); }, 2000);
  };

  const changeRole = (memberId, newRole) => {
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    setShowRoleModal(null);
  };

  const removeMember = (id) => setTeam(prev => prev.filter(m => m.id !== id));

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-h2 text-on-surface">Team Management</h1>
          <motion.button
            className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs shadow-lg shadow-primary-container/25"
            onClick={() => setShowInvite(true)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            <span className="material-symbols-outlined text-sm">person_add</span> Invite Member
          </motion.button>
        </motion.div>

        <div className="px-lg py-lg space-y-lg">
          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Team Members', value: team.length, icon: 'group', color: 'text-primary' },
              { label: 'Active Now', value: team.filter(m => m.lastActive === 'Now' || m.lastActive.includes('hrs')).length, icon: 'person_check', color: 'text-secondary' },
              { label: 'Camera Accounts', value: CAMERA_ACCOUNTS.length, icon: 'camera_alt', color: 'text-blue-400' },
              { label: 'Pending Invites', value: team.filter(m => m.status === 'pending').length, icon: 'mail', color: 'text-amber-400' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3 }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-xs border-b border-outline-variant/10">
            {['team', 'roles', 'cameras'].map(tab => (
              <motion.button
                key={tab}
                className={`py-sm px-md text-sm font-label-md capitalize relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'cameras' ? 'Camera Accounts' : tab}
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="team-tab" />}
              </motion.button>
            ))}
          </div>

          {/* Team members */}
          {activeTab === 'team' && (
            <motion.div className="space-y-sm" variants={staggerContainer(0.06)} initial="hidden" animate="visible">
              {team.map((member, i) => {
                const role = getRoleConfig(member.role);
                return (
                  <motion.div key={member.id} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -2 }}>
                    <div className="flex items-center gap-md">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm flex-wrap">
                          <span className="font-label-md text-on-surface">{member.name}</span>
                          {member.status === 'pending' && (
                            <span className="text-xs bg-amber-400/15 text-amber-400 border border-amber-400/20 px-sm py-0.5 rounded-full">Pending invite</span>
                          )}
                        </div>
                        <div className="text-on-surface-variant text-sm">{member.email}</div>
                        <div className="flex items-center gap-sm mt-xs flex-wrap">
                          <span className={`text-xs px-sm py-0.5 rounded-full border font-label-md ${role.color}`}>
                            {role.label}
                          </span>
                          <span className="text-on-surface-variant text-xs">Events: {member.events}</span>
                          <span className="text-on-surface-variant text-xs">Last active: {member.lastActive}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-sm flex-shrink-0">
                        {member.role !== 'owner' && (
                          <>
                            <motion.button
                              className="px-sm py-xs glass-card border border-outline-variant/20 text-on-surface-variant rounded-xl text-xs font-label-md"
                              onClick={() => setShowRoleModal(member)}
                              whileHover={{ scale: 1.04 }}
                            >
                              Change Role
                            </motion.button>
                            <motion.button
                              className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-red-400"
                              onClick={() => removeMember(member.id)}
                              whileHover={{ scale: 1.05 }}
                            >
                              <span className="material-symbols-outlined text-sm">person_remove</span>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Roles reference */}
          {activeTab === 'roles' && (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
              {ROLES.map((role, i) => (
                <motion.div key={role.id} variants={fadeInUp} className="glass-card p-lg rounded-2xl">
                  <div className="flex items-center gap-sm mb-md">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${role.color}`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{role.icon}</span>
                    </div>
                    <div>
                      <div className="font-display text-h3 text-on-surface">{role.label}</div>
                      <div className="text-on-surface-variant text-xs">{role.desc}</div>
                    </div>
                    <div className="ml-auto text-on-surface-variant text-xs">{team.filter(m => m.role === role.id).length} members</div>
                  </div>
                  <div className="space-y-xs">
                    {role.perms.map((perm, j) => (
                      <div key={j} className="flex items-center gap-xs text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        {perm}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Camera accounts */}
          {activeTab === 'cameras' && (
            <div className="space-y-md">
              <div className="glass-card p-lg rounded-2xl">
                <div className="flex items-center justify-between mb-lg">
                  <h3 className="font-display text-h3 text-on-surface">Camera Accounts</h3>
                  <motion.button className="px-md py-xs bg-primary-container text-on-primary-container rounded-xl text-sm font-label-md flex items-center gap-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <span className="material-symbols-outlined text-sm">add</span> Add Camera
                  </motion.button>
                </div>
                <p className="text-on-surface-variant text-sm mb-lg">Each camera needs its own account for Camera2Cloud uploads. Up to 10 cameras per event.</p>
                <div className="space-y-sm">
                  {CAMERA_ACCOUNTS.map((cam, i) => (
                    <motion.div key={cam.id} className="bg-surface-container rounded-xl p-md flex items-center justify-between" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                      <div className="flex items-center gap-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cam.status === 'connected' ? 'bg-secondary/15' : 'bg-amber-400/15'}`}>
                          <span className={`material-symbols-outlined ${cam.status === 'connected' ? 'text-secondary' : 'text-amber-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {cam.status === 'connected' ? 'camera_alt' : 'sync'}
                          </span>
                        </div>
                        <div>
                          <div className="font-label-md text-sm text-on-surface">{cam.name}</div>
                          <div className="text-on-surface-variant text-xs capitalize">{cam.status} · Last upload: {cam.lastUpload}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-md">
                        <div className="text-right">
                          <div className="font-label-md text-sm text-on-surface">{cam.uploads.toLocaleString()}</div>
                          <div className="text-on-surface-variant text-xs">uploads</div>
                        </div>
                        <motion.button className="p-sm glass-card rounded-xl text-on-surface-variant hover:text-red-400" whileHover={{ scale: 1.05 }}>
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
            <motion.div className="bg-surface-container rounded-3xl p-xl w-full max-w-md shadow-2xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h2 className="font-display text-h2 text-on-surface mb-lg">Invite Team Member</h2>
              <div className="space-y-md">
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-xs block">Email Address</label>
                  <input value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} placeholder="teammate@studio.com" className="w-full bg-surface-variant border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-sm block">Role</label>
                  <div className="space-y-sm">
                    {ROLES.filter(r => r.id !== 'owner').map(role => (
                      <motion.div
                        key={role.id}
                        className={`p-sm rounded-xl cursor-pointer border ${invite.role === role.id ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/20 bg-surface-variant/50'}`}
                        onClick={() => setInvite(i => ({ ...i, role: role.id }))}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-sm">
                          <span className={`material-symbols-outlined text-sm ${invite.role === role.id ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{role.icon}</span>
                          <div>
                            <div className="font-label-md text-sm text-on-surface">{role.label}</div>
                            <div className="text-on-surface-variant text-xs">{role.desc}</div>
                          </div>
                          {invite.role === role.id && <span className="ml-auto material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-on-surface-variant text-sm font-label-md mb-xs block">Event Access</label>
                  <select value={invite.events} onChange={e => setInvite(i => ({ ...i, events: e.target.value }))} className="w-full bg-surface-variant border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none">
                    <option value="All">All Events</option>
                    <option value="Sharma Wedding">Sharma–Verma Wedding</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-sm mt-lg">
                <motion.button
                  className="flex-1 bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md shadow-lg shadow-primary-container/25 flex items-center justify-center gap-xs"
                  onClick={sendInvite} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {inviteSent ? (
                    <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Sent!</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">send</span> Send Invite</>
                  )}
                </motion.button>
                <motion.button className="px-lg py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => setShowInvite(false)} whileHover={{ scale: 1.02 }}>Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Role Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setShowRoleModal(null)}>
            <motion.div className="bg-surface-container rounded-3xl p-xl w-full max-w-sm shadow-2xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h2 className="font-display text-h2 text-on-surface mb-xs">Change Role</h2>
              <p className="text-on-surface-variant text-sm mb-lg">{showRoleModal.name}</p>
              <div className="space-y-sm">
                {ROLES.filter(r => r.id !== 'owner').map(role => (
                  <motion.div
                    key={role.id}
                    className={`p-sm rounded-xl cursor-pointer border flex items-center gap-sm ${showRoleModal.role === role.id ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant/20 hover:bg-surface-variant/50'}`}
                    onClick={() => changeRole(showRoleModal.id, role.id)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <span className={`material-symbols-outlined text-sm ${showRoleModal.role === role.id ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{role.icon}</span>
                    <div>
                      <div className="font-label-md text-sm text-on-surface">{role.label}</div>
                      <div className="text-on-surface-variant text-xs">{role.desc}</div>
                    </div>
                    {showRoleModal.role === role.id && <span className="ml-auto material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                  </motion.div>
                ))}
              </div>
              <motion.button className="mt-lg w-full py-sm glass-card border border-outline-variant/20 text-on-surface rounded-xl font-label-md" onClick={() => setShowRoleModal(null)} whileHover={{ scale: 1.02 }}>Cancel</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppSidebar>
  );
}
