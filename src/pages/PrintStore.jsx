import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '../components/AppSidebar';
import { fadeInUp, staggerContainer } from '../utils/animations';

const PRINT_PRODUCTS = [
  { id: 1, category: 'Prints', name: '4×6 Print', desc: 'Standard glossy/matte print', price: 49, unit: 'per print', icon: 'image', popular: false },
  { id: 2, category: 'Prints', name: '5×7 Print', desc: 'Medium glossy/matte print', price: 79, unit: 'per print', icon: 'image', popular: true },
  { id: 3, category: 'Prints', name: '8×10 Print', desc: 'Large glossy/matte print', price: 149, unit: 'per print', icon: 'image', popular: false },
  { id: 4, category: 'Canvas', name: '12×16 Canvas', desc: 'Stretched canvas with frame', price: 799, unit: 'per piece', icon: 'texture', popular: true },
  { id: 5, category: 'Canvas', name: '16×20 Canvas', desc: 'Premium stretched canvas', price: 1299, unit: 'per piece', icon: 'texture', popular: false },
  { id: 6, category: 'Albums', name: 'Photo Book (20 pages)', desc: 'Layflat premium photo book', price: 1999, unit: 'per book', icon: 'menu_book', popular: true },
  { id: 7, category: 'Albums', name: 'Wedding Album (40 pages)', desc: 'Luxury layflat album with cover', price: 4999, unit: 'per album', icon: 'auto_stories', popular: false },
  { id: 8, category: 'Digital', name: 'Digital Download', desc: 'Full-resolution JPEG', price: 99, unit: 'per photo', icon: 'download', popular: false },
  { id: 9, category: 'Digital', name: 'Full Gallery Download', desc: 'All event photos in ZIP', price: 999, unit: 'per gallery', icon: 'folder_zip', popular: true },
  { id: 10, category: 'Gifts', name: 'Photo Mug', desc: 'Custom printed 330ml mug', price: 399, unit: 'per mug', icon: 'local_cafe', popular: false },
  { id: 11, category: 'Gifts', name: 'Photo Calendar', desc: '12-month personalised calendar', price: 699, unit: 'per calendar', icon: 'calendar_month', popular: false },
  { id: 12, category: 'Gifts', name: 'Acrylic Standee', desc: '5×7 acrylic photo block', price: 549, unit: 'per piece', icon: 'vertical_shades_closed', popular: false },
];

const ORDERS = [
  { id: 'ORD-001', guest: 'Priya Sharma', items: '2× 5×7 Print, 1× 12×16 Canvas', total: 957, status: 'processing', date: 'May 17, 2026' },
  { id: 'ORD-002', guest: 'Sunita Verma', items: '1× Photo Book (20 pages)', total: 1999, status: 'confirmed', date: 'May 17, 2026' },
  { id: 'ORD-003', guest: 'Arjun Verma', items: '1× Full Gallery Download', total: 999, status: 'delivered', date: 'May 16, 2026' },
];

const statusConfig = {
  processing: { label: 'Processing', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  confirmed: { label: 'Confirmed', color: 'text-secondary bg-secondary/10 border-secondary/20' },
  delivered: { label: 'Delivered', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
};

const CATS = ['All', 'Prints', 'Canvas', 'Albums', 'Digital', 'Gifts'];

export default function PrintStore() {
  const [activeTab, setActiveTab] = useState('products');
  const [filterCat, setFilterCat] = useState('All');
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [markup, setMarkup] = useState(30);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState(PRINT_PRODUCTS);

  const filtered = products.filter(p => filterCat === 'All' || p.category === filterCat);
  const totalRevenue = ORDERS.reduce((a, o) => a + o.total, 0);
  const enabledCount = products.length;

  const sellingPrice = (base) => Math.round(base * (1 + markup / 100));

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        <motion.div
          className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10 px-lg py-sm flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <div>
            <h1 className="font-display text-h2 text-on-surface">Print Store</h1>
            <div className="flex items-center gap-xs">
              <span className={`w-2 h-2 rounded-full ${storeEnabled ? 'bg-secondary animate-pulse' : 'bg-on-surface-variant'}`} />
              <p className="text-on-surface-variant text-xs">{storeEnabled ? 'Store is live — guests can order' : 'Store is paused'}</p>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-on-surface-variant text-sm">Store</span>
            <motion.div
              className={`w-12 h-6 rounded-full relative cursor-pointer ${storeEnabled ? 'bg-primary-container' : 'bg-surface-variant'}`}
              onClick={() => setStoreEnabled(!storeEnabled)}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5" animate={{ left: storeEnabled ? '26px' : '2px' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            </motion.div>
          </div>
        </motion.div>

        <div className="px-lg py-lg space-y-lg">
          {/* Stats */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-md" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: 'payments', color: 'text-secondary' },
              { label: 'Orders', value: ORDERS.length, icon: 'shopping_bag', color: 'text-primary' },
              { label: 'Products Listed', value: enabledCount, icon: 'inventory_2', color: 'text-on-surface-variant' },
              { label: 'Your Margin', value: `${markup}%`, icon: 'trending_up', color: 'text-secondary' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass-card p-md rounded-2xl" whileHover={{ y: -3 }}>
                <span className={`material-symbols-outlined text-h2 mb-xs block ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div className="font-display text-h2 text-on-surface">{s.value}</div>
                <div className="text-on-surface-variant text-sm">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Markup control */}
          <div className="glass-card p-lg rounded-2xl">
            <div className="flex items-center justify-between mb-sm">
              <div>
                <h3 className="font-display text-h3 text-on-surface">Your Profit Markup</h3>
                <p className="text-on-surface-variant text-sm">Set how much you earn above base production cost</p>
              </div>
              <div className="text-h2 font-display text-secondary">{markup}%</div>
            </div>
            <input type="range" min={0} max={100} value={markup} onChange={e => setMarkup(Number(e.target.value))} className="w-full accent-[#7c3aed]" />
            <div className="flex justify-between text-xs text-on-surface-variant mt-xs">
              <span>0% (pass-through)</span><span>100% (double price)</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-xs border-b border-outline-variant/10">
            {['products', 'orders', 'settings'].map(tab => (
              <motion.button
                key={tab}
                className={`py-sm px-md text-sm font-label-md capitalize relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'orders' && ORDERS.filter(o => o.status === 'processing').length > 0 && (
                  <span className="ml-xs w-4 h-4 bg-primary-container text-on-primary-container rounded-full text-xs inline-flex items-center justify-center font-bold">{ORDERS.filter(o => o.status === 'processing').length}</span>
                )}
                {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" layoutId="store-tab" />}
              </motion.button>
            ))}
          </div>

          {/* Products */}
          {activeTab === 'products' && (
            <div className="space-y-md">
              <div className="flex gap-xs flex-wrap">
                {CATS.map(c => (
                  <motion.button
                    key={c}
                    className={`px-sm py-xs rounded-full text-xs font-label-md ${filterCat === c ? 'bg-primary-container text-on-primary-container' : 'glass-card text-on-surface-variant border border-outline-variant/20'}`}
                    onClick={() => setFilterCat(c)}
                    whileHover={{ scale: 1.05 }}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md" variants={staggerContainer(0.05)} initial="hidden" animate="visible">
                {filtered.map((product) => (
                  <motion.div key={product.id} variants={fadeInUp} className="glass-card p-md rounded-2xl relative" whileHover={{ y: -4 }}>
                    {product.popular && (
                      <div className="absolute top-sm right-sm bg-primary-container text-on-primary-container text-xs font-label-md px-sm py-0.5 rounded-full">Popular</div>
                    )}
                    <div className="flex items-start gap-sm mb-md">
                      <div className="w-10 h-10 rounded-xl bg-primary-container/15 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{product.icon}</span>
                      </div>
                      <div>
                        <div className="font-label-md text-on-surface">{product.name}</div>
                        <div className="text-on-surface-variant text-xs">{product.desc}</div>
                        <div className="text-on-surface-variant text-xs mt-xs">{product.category}</div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-on-surface-variant text-xs">Base cost</div>
                        <div className="text-on-surface text-sm font-label-md">₹{product.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-on-surface-variant text-xs">Guest pays</div>
                        <div className="text-secondary font-display text-h3">₹{sellingPrice(product.price)}</div>
                      </div>
                    </div>
                    <div className="mt-sm pt-sm border-t border-outline-variant/10 flex items-center justify-between">
                      <div className="text-secondary text-xs font-label-md">
                        You earn: ₹{sellingPrice(product.price) - product.price}
                      </div>
                      <motion.button
                        className="p-xs glass-card rounded-lg text-on-surface-variant hover:text-primary"
                        onClick={() => setEditingProduct(product)}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <motion.div className="space-y-sm" variants={staggerContainer(0.07)} initial="hidden" animate="visible">
              {ORDERS.map((order) => {
                const sc = statusConfig[order.status];
                return (
                  <motion.div key={order.id} variants={fadeInUp} className="glass-card p-md rounded-2xl">
                    <div className="flex items-center justify-between flex-wrap gap-sm">
                      <div>
                        <div className="flex items-center gap-sm">
                          <span className="font-label-md text-on-surface">{order.id}</span>
                          <span className={`text-xs px-sm py-0.5 rounded-full border font-label-md ${sc.color}`}>{sc.label}</span>
                        </div>
                        <div className="text-primary font-label-md text-sm mt-xs">{order.guest}</div>
                        <div className="text-on-surface-variant text-xs">{order.items}</div>
                        <div className="text-on-surface-variant text-xs">{order.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-h2 text-secondary">₹{order.total.toLocaleString()}</div>
                        <div className="text-on-surface-variant text-xs">+₹{Math.round(order.total * markup / (100 + markup))} your margin</div>
                        {order.status === 'processing' && (
                          <motion.button className="mt-sm px-sm py-xs bg-secondary/15 text-secondary rounded-lg text-xs font-label-md" whileHover={{ scale: 1.05 }}>Mark Confirmed</motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-lg space-y-md">
              <div className="glass-card p-lg rounded-2xl space-y-md">
                <h3 className="font-display text-h3 text-on-surface">Store Settings</h3>
                {[
                  { label: 'Store Name', value: 'Sharma Studios Print Store', placeholder: 'Your store name' },
                  { label: 'WhatsApp for Order Updates', value: '+91 98765 43210', placeholder: '+91 XXXXX XXXXX' },
                  { label: 'Fulfilment Partner', value: 'PhotoBook India', placeholder: 'Lab name' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-on-surface-variant text-sm font-label-md mb-xs block">{f.label}</label>
                    <input defaultValue={f.value} placeholder={f.placeholder} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-md py-sm text-on-surface text-sm focus:border-primary outline-none" />
                  </div>
                ))}
                <motion.button className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-md text-sm shadow-lg shadow-primary-container/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  Save Settings
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppSidebar>
  );
}
