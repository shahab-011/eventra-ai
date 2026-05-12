import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fadeInUp, staggerContainer, viewport } from '../utils/animations';

const plans = [
  { name: 'Free', storage: '—', price: { monthly: '₹0', annual: '₹0' }, period: '/month', desc: 'For individual hosts up to 40 guests', color: 'text-on-surface-variant', features: ['1 active event', 'Up to 40 guests', 'Basic QR gallery', 'WhatsApp sharing', 'Watermarked media'], featured: false, cta: 'Start Free', ctaStyle: 'border border-outline-variant text-on-surface hover:bg-surface-variant' },
  { name: 'Starter', storage: '100 GB', price: { monthly: '₹999', annual: '₹799' }, period: '/month', desc: 'For solo photographers', color: 'text-on-surface', features: ['Unlimited events', 'AI Face Recognition', 'Camera2Cloud™', 'WhatsApp Bot', 'White-label gallery', 'Digital invites'], featured: false, cta: 'Get Starter', ctaStyle: 'border border-outline-variant text-on-surface hover:bg-surface-variant' },
  { name: 'Growth', storage: '500 GB', price: { monthly: '₹2,499', annual: '₹1,999' }, period: '/month', desc: 'For active wedding photographers', color: 'text-on-surface', features: ['Everything in Starter', 'Priority support', '3 team seats', 'AI photo editing', 'Client proofing', 'Portfolio galleries'], featured: false, cta: 'Get Growth', ctaStyle: 'border border-outline-variant text-on-surface hover:bg-surface-variant' },
  { name: 'Professional', storage: '1 TB', price: { monthly: '₹3,999', annual: '₹3,199' }, period: '/month', desc: 'For full-time studios', color: 'text-primary', features: ['Everything in Growth', '5 team seats', 'Pixel integration', 'Custom domain SSL', 'Event transfer', 'Advanced analytics'], featured: true, cta: 'Get Professional', ctaStyle: 'bg-primary-container text-on-primary-container shadow-xl shadow-primary-container/30' },
  { name: 'Studio', storage: '2 TB', price: { monthly: '₹6,999', annual: '₹5,599' }, period: '/month', desc: 'For large agencies', color: 'text-on-surface', features: ['Everything in Pro', '10 team seats', 'Multi-camera support', 'Custom mobile app', 'Dedicated manager', 'SLA guarantee'], featured: false, cta: 'Get Studio', ctaStyle: 'border border-outline-variant text-on-surface hover:bg-surface-variant' },
  { name: 'Enterprise', storage: '8 TB', price: { monthly: 'Custom', annual: 'Custom' }, period: '', desc: 'For organisations & enterprises', color: 'text-on-surface', features: ['Everything in Studio', 'Unlimited team seats', 'Custom AI training', 'SSO + API access', 'Dedicated infrastructure', 'Custom contract'], featured: false, cta: 'Contact Sales', ctaStyle: 'border border-outline-variant text-on-surface hover:bg-surface-variant' },
];

const tableFeatures = [
  { group: 'Storage', rows: [
    { name: 'Cloud Storage', vals: ['—', '100 GB', '500 GB', '1 TB', '2 TB', '8 TB'] },
    { name: 'File Retention', vals: ['7 days', '30 days', '90 days', 'Unlimited', 'Unlimited', 'Unlimited'] },
  ]},
  { group: 'AI & Core', rows: [
    { name: 'AI Face Recognition', vals: [false, true, true, true, true, true] },
    { name: 'Camera2Cloud™', vals: [false, true, true, true, true, true] },
    { name: 'AI Photo Editing', vals: [false, false, true, true, true, true] },
    { name: 'AI Auto-Culling', vals: [false, false, false, true, true, true] },
  ]},
  { group: 'Business', rows: [
    { name: 'White-Label Gallery', vals: [false, true, true, true, true, true] },
    { name: 'Custom Domain + SSL', vals: [false, false, false, true, true, true] },
    { name: 'Pixel Integration', vals: [false, false, false, true, true, true] },
    { name: 'Digital Invites', vals: [false, true, true, true, true, true] },
    { name: 'Team Seats', vals: ['—', '1', '3', '5', '10', 'Unlimited'] },
  ]},
];

const faqs = [
  { q: 'What happens if I exceed my storage limit?', a: 'We notify you at 90% capacity. If you exceed the limit, new uploads pause but all existing galleries remain live for viewing and downloading.' },
  { q: 'Can I cancel or downgrade anytime?', a: 'Yes. Cancel anytime — no lock-in. If you cancel, your plan stays active until the end of the billing period.' },
  { q: 'Does AI face recognition cost extra?', a: 'No. AI facial recognition is included in all paid plans at no additional cost, regardless of the number of photos processed.' },
  { q: 'What is the Event Transfer feature?', a: 'After an event concludes, you can transfer storage ownership to the client\'s personal Eventra account. Your business storage is freed, and the client retains full access at personal storage rates (~₹20/GB/year).' },
  { q: 'Can I use a custom domain?', a: 'Custom domains with automatic SSL are available on Professional plans and above. Setup takes under 5 minutes.' },
  { q: 'Is there a free trial?', a: 'Yes — the Free plan is permanently free for events up to 40 guests. Paid plans include a 14-day free trial, no credit card required.' },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-xl px-gutter hero-glow">
        <div className="max-w-[1280px] mx-auto text-center">
          <motion.div variants={staggerContainer(0.12)} initial="hidden" animate="visible">
            <motion.h1 className="font-display text-h1 md:text-display text-on-surface mb-md" variants={fadeInUp}>
              Simple, Transparent Pricing
            </motion.h1>
            <motion.p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-lg" variants={fadeInUp}>
              Storage-based plans. All AI features included. No per-event fees, no hidden charges.
            </motion.p>
            {/* Toggle */}
            <motion.div className="flex items-center justify-center gap-md" variants={fadeInUp}>
              <span className={`font-label-md text-label-md ${!annual ? 'text-on-surface' : 'text-on-surface-variant'}`}>Monthly</span>
              <motion.button
                className="relative w-14 h-7 rounded-full bg-primary-container/30 border border-primary-container/40 flex items-center px-1"
                onClick={() => setAnnual(!annual)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 bg-primary-container rounded-full shadow-md"
                  animate={{ x: annual ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
              <span className={`font-label-md text-label-md flex items-center gap-xs ${annual ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                Annual
                <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-xl px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md"
            variants={staggerContainer(0.07)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`glass-card p-lg rounded-2xl flex flex-col relative ${plan.featured ? 'border-2 border-primary-container glow-border' : 'border border-outline-variant/10'}`}
                variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container px-md py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg shadow-primary-container/30">
                    ✦ Most Popular
                  </div>
                )}
                <div className="mb-lg">
                  <h3 className={`font-display text-h3 mb-xs ${plan.color}`}>{plan.name}</h3>
                  {plan.storage !== '—' && (
                    <div className="text-outline text-sm font-label-md mb-sm">{plan.storage} Storage</div>
                  )}
                  <div className="font-display text-h1 text-on-surface mb-xs">
                    <AnimatePresence mode="wait">
                      <motion.span key={annual ? 'annual' : 'monthly'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {annual ? plan.price.annual : plan.price.monthly}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-body-md font-body-md text-on-surface-variant">{plan.period}</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">{plan.desc}</p>
                </div>
                <ul className="space-y-sm mb-lg flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-sm text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.name === 'Enterprise' ? '/contactbookdemo' : '/businesssignup'}>
                  <motion.button
                    className={`w-full py-sm rounded-xl font-label-md transition-colors ${plan.ctaStyle}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-xl px-gutter bg-surface-container-lowest">
        <div className="max-w-[1280px] mx-auto">
          <motion.h2 className="font-display text-h2 text-on-surface text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            Compare Every Feature
          </motion.h2>
          <motion.div className="overflow-x-auto rounded-2xl border border-outline-variant/20" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  <th className="py-md px-lg text-left text-on-surface-variant font-label-md w-48">Feature</th>
                  {plans.map(p => (
                    <th key={p.name} className={`py-md px-md text-center font-label-md ${p.featured ? 'text-primary' : 'text-on-surface-variant'}`}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableFeatures.map((group) => (
                  <React.Fragment key={group.group}>
                    <tr className="bg-surface-container-low/60">
                      <td colSpan={7} className="py-sm px-lg text-xs font-bold uppercase tracking-widest text-primary">{group.group}</td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.name} className="border-b border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                        <td className="py-md px-lg text-on-surface-variant">{row.name}</td>
                        {row.vals.map((v, j) => (
                          <td key={j} className={`py-md px-md text-center ${plans[j]?.featured ? 'bg-primary-container/4' : ''}`}>
                            {typeof v === 'boolean' ? (
                              <span className={`material-symbols-outlined text-sm ${v ? 'text-secondary' : 'text-outline'}`} style={{ fontVariationSettings: v ? "'FILL' 1" : "'FILL' 0" }}>{v ? 'check_circle' : 'remove'}</span>
                            ) : (
                              <span className="text-on-surface-variant font-label-md">{v}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Special callouts */}
      <section className="py-xl px-gutter">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-md">
          {[
            { icon: 'move_down', color: 'text-primary', title: 'Event Transfer', desc: 'After an event ends, transfer storage ownership to your client. Your business storage is freed — they get full access at personal rates (~₹20/GB/year). Best of both worlds.' },
            { icon: 'qr_code_2', color: 'text-secondary', title: 'Universal QR Code', desc: 'One QR code for all your events. Dynamic routing lets you use the same physical cards, stands, and print materials — just update the target event in your dashboard.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="glass-card rounded-2xl p-lg relative overflow-hidden group"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-primary-container/10 rounded-full blur-2xl group-hover:bg-primary-container/20 transition-all duration-500" />
              <span className={`material-symbols-outlined text-h1 mb-md block ${item.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              <h3 className="font-display text-h3 text-on-surface mb-sm">{item.title}</h3>
              <p className="text-on-surface-variant relative z-10">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-xl px-gutter bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto">
          <motion.h2 className="font-display text-h2 text-on-surface text-center mb-xl" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            Frequently Asked Questions
          </motion.h2>
          <motion.div className="space-y-sm" variants={staggerContainer(0.07)} initial="hidden" whileInView="visible" viewport={viewport}>
            {faqs.map((faq, i) => (
              <motion.div key={i} className="glass-card rounded-xl overflow-hidden" variants={fadeInUp}>
                <button
                  className="w-full flex justify-between items-center p-md text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-display text-h3 text-on-surface">{faq.q}</span>
                  <motion.span
                    className="material-symbols-outlined text-on-surface-variant flex-shrink-0 ml-md"
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    expand_more
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <p className="px-md pb-md text-on-surface-variant leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-xl px-gutter">
        <div className="max-w-[1280px] mx-auto">
          <motion.div className="glass-card rounded-3xl p-xl text-center relative overflow-hidden" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <div className="absolute inset-0 bg-primary-container/8 pointer-events-none" />
            <h2 className="font-display text-h1 text-on-surface mb-md relative z-10">Start your free trial today</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto mb-lg relative z-10">Join 4,000+ businesses. No credit card required. Upgrade or cancel anytime.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-md relative z-10">
              <Link to="/businesssignup">
                <motion.button className="bg-primary-container text-on-primary-container px-xl py-md rounded-full font-display text-h3 shadow-xl shadow-primary-container/25" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  Start your free trial
                </motion.button>
              </Link>
              <Link to="/contactbookdemo">
                <motion.button className="glass-card text-on-surface px-xl py-md rounded-full font-label-md border border-outline-variant/20" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  Talk to an expert
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
