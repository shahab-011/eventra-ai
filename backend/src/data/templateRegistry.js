/**
 * Invite Template Registry — 100+ templates for InviteBuilder.jsx.
 *
 * Each template describes layout metadata and default color slots.
 * The animated renderer in the frontend resolves the id and applies
 * the corresponding animation/layout component.
 *
 * Fields:
 *   id            — unique template identifier (passed to Invite.templateId)
 *   name          — display name in the picker
 *   category      — matches EventType enum
 *   layout        — FULL_BLEED | SPLIT | MINIMAL | CARD | MAGAZINE | POSTER
 *   animationStyle — FADE | SLIDE | ZOOM | PARALLAX | FLOAT | TYPEWRITER | NONE
 *   colorSlots    — default palette (overridable via Invite.customData.colors)
 *   fontPair      — SCRIPT_SERIF | MODERN_SANS | BOLD_SANS | SERIF_SANS |
 *                   DISPLAY_SERIF | HANDWRITTEN | MONO_SANS
 *   tags          — for frontend search / filtering
 */

export const TEMPLATES = [
  // ─── WEDDING ──────────────────────────────────────────────────
  {
    id: 'tpl_wed_001', name: 'Rose Garden',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#C9A96E', accent: '#8B4A62', text: '#2C1810', background: '#FDF8F0' },
    fontPair: 'SCRIPT_SERIF', tags: ['romantic', 'floral', 'elegant'],
  },
  {
    id: 'tpl_wed_002', name: 'Golden Hour',
    category: 'WEDDING', layout: 'SPLIT', animationStyle: 'SLIDE',
    colorSlots: { primary: '#D4AF37', accent: '#2C2C2C', text: '#1A1A1A', background: '#FFFDF5' },
    fontPair: 'SERIF_SANS', tags: ['luxe', 'modern', 'gold'],
  },
  {
    id: 'tpl_wed_003', name: 'Ivory Dreams',
    category: 'WEDDING', layout: 'MINIMAL', animationStyle: 'FADE',
    colorSlots: { primary: '#E8DDD0', accent: '#9B7B5C', text: '#3D2B1F', background: '#FAFAF7' },
    fontPair: 'DISPLAY_SERIF', tags: ['minimal', 'classic', 'ivory'],
  },
  {
    id: 'tpl_wed_004', name: 'Bougainvillea',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#E8476A', accent: '#F9A825', text: '#1A1A1A', background: '#FFF0F3' },
    fontPair: 'SCRIPT_SERIF', tags: ['vibrant', 'tropical', 'bold'],
  },
  {
    id: 'tpl_wed_005', name: 'Dusty Rose',
    category: 'WEDDING', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#DCAEB4', accent: '#7B5C6A', text: '#3D2B31', background: '#FDF5F6' },
    fontPair: 'HANDWRITTEN', tags: ['soft', 'pastel', 'vintage'],
  },
  {
    id: 'tpl_wed_006', name: 'Midnight Blue',
    category: 'WEDDING', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#1B3A6B', accent: '#C9A96E', text: '#FFFFFF', background: '#0D1F3C' },
    fontPair: 'SERIF_SANS', tags: ['dramatic', 'dark', 'luxe'],
  },
  {
    id: 'tpl_wed_007', name: 'Mehndi Magic',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#2E7D32', accent: '#F9A825', text: '#1A1A1A', background: '#F1F8E9' },
    fontPair: 'SCRIPT_SERIF', tags: ['mehndi', 'indian', 'traditional'],
  },
  {
    id: 'tpl_wed_008', name: 'Haldi Ceremony',
    category: 'WEDDING', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#F9A825', accent: '#E65100', text: '#1A1A1A', background: '#FFFDE7' },
    fontPair: 'DISPLAY_SERIF', tags: ['haldi', 'yellow', 'festive'],
  },
  {
    id: 'tpl_wed_009', name: 'Sangeet Night',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FLOAT',
    colorSlots: { primary: '#6A1B9A', accent: '#F48FB1', text: '#FFFFFF', background: '#2D0047' },
    fontPair: 'BOLD_SANS', tags: ['sangeet', 'purple', 'dance'],
  },
  {
    id: 'tpl_wed_010', name: 'Reception Gala',
    category: 'WEDDING', layout: 'MAGAZINE', animationStyle: 'SLIDE',
    colorSlots: { primary: '#BF953F', accent: '#FCF6BA', text: '#2C2C2C', background: '#1A1A1A' },
    fontPair: 'MODERN_SANS', tags: ['reception', 'glamour', 'gold'],
  },
  {
    id: 'tpl_wed_011', name: 'Garden Party',
    category: 'WEDDING', layout: 'CARD', animationStyle: 'FADE',
    colorSlots: { primary: '#4CAF50', accent: '#FFCC80', text: '#2C4A1E', background: '#F1F8E9' },
    fontPair: 'HANDWRITTEN', tags: ['garden', 'outdoor', 'fresh'],
  },
  {
    id: 'tpl_wed_012', name: 'Destination Beach',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#00ACC1', accent: '#FFD54F', text: '#FFFFFF', background: '#00838F' },
    fontPair: 'MODERN_SANS', tags: ['beach', 'destination', 'summer'],
  },
  {
    id: 'tpl_wed_013', name: 'Rustic Barn',
    category: 'WEDDING', layout: 'SPLIT', animationStyle: 'FADE',
    colorSlots: { primary: '#795548', accent: '#C8A96E', text: '#3E2723', background: '#EFEBE9' },
    fontPair: 'HANDWRITTEN', tags: ['rustic', 'barn', 'country'],
  },
  {
    id: 'tpl_wed_014', name: 'Floral Arch',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#E91E63', accent: '#FFFFFF', text: '#1A1A1A', background: '#FCE4EC' },
    fontPair: 'SCRIPT_SERIF', tags: ['floral', 'arch', 'ceremony'],
  },
  {
    id: 'tpl_wed_015', name: 'Fort Palace',
    category: 'WEDDING', layout: 'MAGAZINE', animationStyle: 'SLIDE',
    colorSlots: { primary: '#BF360C', accent: '#FDD835', text: '#FFFFFF', background: '#4E1500' },
    fontPair: 'DISPLAY_SERIF', tags: ['palace', 'royal', 'heritage'],
  },
  {
    id: 'tpl_wed_016', name: 'Pastel Carousel',
    category: 'WEDDING', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#F48FB1', accent: '#80DEEA', text: '#3D2B31', background: '#FFF9FC' },
    fontPair: 'HANDWRITTEN', tags: ['pastel', 'playful', 'cute'],
  },
  {
    id: 'tpl_wed_017', name: 'Mandap Bliss',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#C62828', accent: '#FFD600', text: '#1A1A1A', background: '#FFF8E1' },
    fontPair: 'DISPLAY_SERIF', tags: ['mandap', 'hindu', 'traditional'],
  },
  {
    id: 'tpl_wed_018', name: 'Nikah Celebration',
    category: 'WEDDING', layout: 'SPLIT', animationStyle: 'SLIDE',
    colorSlots: { primary: '#1A237E', accent: '#C5A028', text: '#FFFFFF', background: '#0D1233' },
    fontPair: 'SERIF_SANS', tags: ['nikah', 'muslim', 'elegant'],
  },
  {
    id: 'tpl_wed_019', name: 'Anand Karaj',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FF8F00', accent: '#1B5E20', text: '#1A1A1A', background: '#FFF8E1' },
    fontPair: 'SCRIPT_SERIF', tags: ['sikh', 'anand karaj', 'vibrant'],
  },
  {
    id: 'tpl_wed_020', name: 'Church White',
    category: 'WEDDING', layout: 'MINIMAL', animationStyle: 'FADE',
    colorSlots: { primary: '#B0BEC5', accent: '#78909C', text: '#263238', background: '#FFFFFF' },
    fontPair: 'SERIF_SANS', tags: ['church', 'christian', 'white'],
  },
  {
    id: 'tpl_wed_021', name: 'Lavender Fields',
    category: 'WEDDING', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#9575CD', accent: '#F8BBD9', text: '#2E1760', background: '#F3E5F5' },
    fontPair: 'HANDWRITTEN', tags: ['lavender', 'purple', 'dreamy'],
  },
  {
    id: 'tpl_wed_022', name: 'Ember Glow',
    category: 'WEDDING', layout: 'POSTER', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#FF5722', accent: '#FFC107', text: '#FFFFFF', background: '#1A0A00' },
    fontPair: 'BOLD_SANS', tags: ['fire', 'warm', 'dramatic'],
  },
  {
    id: 'tpl_wed_023', name: 'Silver Script',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#9E9E9E', accent: '#212121', text: '#212121', background: '#FAFAFA' },
    fontPair: 'SCRIPT_SERIF', tags: ['silver', 'monochrome', 'script'],
  },
  {
    id: 'tpl_wed_024', name: 'Teal & Gold',
    category: 'WEDDING', layout: 'MAGAZINE', animationStyle: 'SLIDE',
    colorSlots: { primary: '#00695C', accent: '#D4AF37', text: '#FFFFFF', background: '#00251A' },
    fontPair: 'DISPLAY_SERIF', tags: ['teal', 'gold', 'luxe'],
  },
  {
    id: 'tpl_wed_025', name: 'Champagne Toast',
    category: 'WEDDING', layout: 'SPLIT', animationStyle: 'FADE',
    colorSlots: { primary: '#F5DEB3', accent: '#C19A6B', text: '#3D2B1F', background: '#FFFAF0' },
    fontPair: 'SERIF_SANS', tags: ['champagne', 'toast', 'classy'],
  },
  {
    id: 'tpl_wed_026', name: 'Vintage Lace',
    category: 'WEDDING', layout: 'CARD', animationStyle: 'FADE',
    colorSlots: { primary: '#D7CCC8', accent: '#8D6E63', text: '#3E2723', background: '#EFEBE9' },
    fontPair: 'SCRIPT_SERIF', tags: ['vintage', 'lace', 'antique'],
  },
  {
    id: 'tpl_wed_027', name: 'Neon Fiesta',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#E040FB', accent: '#00E5FF', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'BOLD_SANS', tags: ['neon', 'party', 'modern'],
  },
  {
    id: 'tpl_wed_028', name: 'Monsoon Romance',
    category: 'WEDDING', layout: 'MINIMAL', animationStyle: 'FLOAT',
    colorSlots: { primary: '#1565C0', accent: '#90CAF9', text: '#0D2137', background: '#E3F2FD' },
    fontPair: 'HANDWRITTEN', tags: ['rain', 'monsoon', 'romantic'],
  },
  {
    id: 'tpl_wed_029', name: 'Marigold Mandala',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FF8F00', accent: '#BF360C', text: '#1A1A1A', background: '#FFF3E0' },
    fontPair: 'DISPLAY_SERIF', tags: ['marigold', 'mandala', 'indian'],
  },
  {
    id: 'tpl_wed_030', name: 'Starlit Night',
    category: 'WEDDING', layout: 'POSTER', animationStyle: 'FLOAT',
    colorSlots: { primary: '#FDD835', accent: '#7C4DFF', text: '#FFFFFF', background: '#0D0D2B' },
    fontPair: 'SCRIPT_SERIF', tags: ['stars', 'night', 'magical'],
  },
  {
    id: 'tpl_wed_031', name: 'Peacock Plume',
    category: 'WEDDING', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#00695C', accent: '#7B1FA2', text: '#FFFFFF', background: '#004D40' },
    fontPair: 'DISPLAY_SERIF', tags: ['peacock', 'jewel', 'exotic'],
  },
  {
    id: 'tpl_wed_032', name: 'Blush & Cream',
    category: 'WEDDING', layout: 'SPLIT', animationStyle: 'FADE',
    colorSlots: { primary: '#FFCDD2', accent: '#EF9A9A', text: '#4A2C2A', background: '#FFF8F8' },
    fontPair: 'SCRIPT_SERIF', tags: ['blush', 'cream', 'soft'],
  },
  {
    id: 'tpl_wed_033', name: 'Dark Florals',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#880E4F', accent: '#F8BBD9', text: '#FFFFFF', background: '#1A0010' },
    fontPair: 'SERIF_SANS', tags: ['dark', 'floral', 'gothic'],
  },
  {
    id: 'tpl_wed_034', name: 'Watercolor',
    category: 'WEDDING', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#81D4FA', accent: '#F48FB1', text: '#1A1A1A', background: '#F5FBFF' },
    fontPair: 'HANDWRITTEN', tags: ['watercolor', 'artistic', 'soft'],
  },
  {
    id: 'tpl_wed_035', name: 'Geometric Gold',
    category: 'WEDDING', layout: 'MINIMAL', animationStyle: 'SLIDE',
    colorSlots: { primary: '#D4AF37', accent: '#1A1A1A', text: '#1A1A1A', background: '#FAFAFA' },
    fontPair: 'MODERN_SANS', tags: ['geometric', 'modern', 'gold'],
  },
  {
    id: 'tpl_wed_036', name: 'Cherry Blossom',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FLOAT',
    colorSlots: { primary: '#F8BBD9', accent: '#AD1457', text: '#2C0A14', background: '#FFF0F7' },
    fontPair: 'SCRIPT_SERIF', tags: ['sakura', 'japanese', 'pink'],
  },
  {
    id: 'tpl_wed_037', name: 'Royal Maroon',
    category: 'WEDDING', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#880E4F', accent: '#FDD835', text: '#FFFFFF', background: '#3D0020' },
    fontPair: 'DISPLAY_SERIF', tags: ['royal', 'maroon', 'rich'],
  },
  {
    id: 'tpl_wed_038', name: 'Boho Chic',
    category: 'WEDDING', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#A1887F', accent: '#FFD54F', text: '#3E2723', background: '#EFEBE9' },
    fontPair: 'HANDWRITTEN', tags: ['boho', 'earthy', 'festival'],
  },
  {
    id: 'tpl_wed_039', name: 'Emerald Isle',
    category: 'WEDDING', layout: 'SPLIT', animationStyle: 'SLIDE',
    colorSlots: { primary: '#1B5E20', accent: '#C8A96E', text: '#FFFFFF', background: '#0A2E0F' },
    fontPair: 'SERIF_SANS', tags: ['emerald', 'green', 'regal'],
  },
  {
    id: 'tpl_wed_040', name: 'Sunrise Ceremony',
    category: 'WEDDING', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#FF7043', accent: '#FDD835', text: '#1A1A1A', background: '#FFF3E0' },
    fontPair: 'SCRIPT_SERIF', tags: ['sunrise', 'morning', 'warm'],
  },

  // ─── CORPORATE ────────────────────────────────────────────────
  {
    id: 'tpl_corp_001', name: 'Summit Pro',
    category: 'CORPORATE', layout: 'MINIMAL', animationStyle: 'FADE',
    colorSlots: { primary: '#1565C0', accent: '#0288D1', text: '#1A1A1A', background: '#FAFAFA' },
    fontPair: 'MODERN_SANS', tags: ['conference', 'professional', 'blue'],
  },
  {
    id: 'tpl_corp_002', name: 'Annual Meet',
    category: 'CORPORATE', layout: 'SPLIT', animationStyle: 'SLIDE',
    colorSlots: { primary: '#263238', accent: '#00BCD4', text: '#FFFFFF', background: '#1A2329' },
    fontPair: 'BOLD_SANS', tags: ['agm', 'corporate', 'dark'],
  },
  {
    id: 'tpl_corp_003', name: 'Product Launch',
    category: 'CORPORATE', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FF4081', accent: '#1A1A1A', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'BOLD_SANS', tags: ['launch', 'tech', 'bold'],
  },
  {
    id: 'tpl_corp_004', name: 'Team Offsite',
    category: 'CORPORATE', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#00796B', accent: '#80CBC4', text: '#1A1A1A', background: '#E0F2F1' },
    fontPair: 'MODERN_SANS', tags: ['offsite', 'team', 'fun'],
  },
  {
    id: 'tpl_corp_005', name: 'Gala Dinner',
    category: 'CORPORATE', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#BF953F', accent: '#FFFFFF', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'DISPLAY_SERIF', tags: ['gala', 'dinner', 'black-tie'],
  },
  {
    id: 'tpl_corp_006', name: 'Tech Horizon',
    category: 'CORPORATE', layout: 'FULL_BLEED', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#7C4DFF', accent: '#00E5FF', text: '#FFFFFF', background: '#050520' },
    fontPair: 'MONO_SANS', tags: ['tech', 'futuristic', 'neon'],
  },
  {
    id: 'tpl_corp_007', name: 'Leadership Summit',
    category: 'CORPORATE', layout: 'SPLIT', animationStyle: 'FADE',
    colorSlots: { primary: '#1B3A6B', accent: '#E8C96E', text: '#FFFFFF', background: '#0D1F3C' },
    fontPair: 'SERIF_SANS', tags: ['leadership', 'executive', 'navy'],
  },
  {
    id: 'tpl_corp_008', name: 'Startup Pitch',
    category: 'CORPORATE', layout: 'POSTER', animationStyle: 'SLIDE',
    colorSlots: { primary: '#FF6D00', accent: '#1A1A1A', text: '#FFFFFF', background: '#FF6D00' },
    fontPair: 'BOLD_SANS', tags: ['startup', 'pitch', 'orange'],
  },
  {
    id: 'tpl_corp_009', name: 'Awards Night',
    category: 'CORPORATE', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FFD700', accent: '#1A1A1A', text: '#1A1A1A', background: '#0A0A0A' },
    fontPair: 'DISPLAY_SERIF', tags: ['awards', 'trophy', 'gold'],
  },
  {
    id: 'tpl_corp_010', name: 'Clean Minimal',
    category: 'CORPORATE', layout: 'MINIMAL', animationStyle: 'NONE',
    colorSlots: { primary: '#424242', accent: '#BDBDBD', text: '#212121', background: '#FFFFFF' },
    fontPair: 'MODERN_SANS', tags: ['minimal', 'clean', 'simple'],
  },
  {
    id: 'tpl_corp_011', name: 'Brand Reveal',
    category: 'CORPORATE', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#E53935', accent: '#FFFFFF', text: '#FFFFFF', background: '#B71C1C' },
    fontPair: 'BOLD_SANS', tags: ['brand', 'reveal', 'red'],
  },
  {
    id: 'tpl_corp_012', name: 'Investor Day',
    category: 'CORPORATE', layout: 'SPLIT', animationStyle: 'SLIDE',
    colorSlots: { primary: '#2E7D32', accent: '#A5D6A7', text: '#1B5E20', background: '#F1F8F1' },
    fontPair: 'SERIF_SANS', tags: ['investor', 'growth', 'green'],
  },
  {
    id: 'tpl_corp_013', name: 'Workshop Day',
    category: 'CORPORATE', layout: 'CARD', animationStyle: 'FADE',
    colorSlots: { primary: '#F57C00', accent: '#FFF3E0', text: '#3E2723', background: '#FFF8F2' },
    fontPair: 'MODERN_SANS', tags: ['workshop', 'training', 'warm'],
  },
  {
    id: 'tpl_corp_014', name: 'Hackathon',
    category: 'CORPORATE', layout: 'FULL_BLEED', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#00E676', accent: '#FF1744', text: '#FFFFFF', background: '#0A0F0A' },
    fontPair: 'MONO_SANS', tags: ['hackathon', 'code', 'tech'],
  },
  {
    id: 'tpl_corp_015', name: 'Charity Drive',
    category: 'CORPORATE', layout: 'FULL_BLEED', animationStyle: 'FLOAT',
    colorSlots: { primary: '#E91E63', accent: '#FFFFFF', text: '#FFFFFF', background: '#880E4F' },
    fontPair: 'SCRIPT_SERIF', tags: ['charity', 'cause', 'pink'],
  },

  // ─── BIRTHDAY ─────────────────────────────────────────────────
  {
    id: 'tpl_bday_001', name: 'Confetti Pop',
    category: 'BIRTHDAY', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FF4081', accent: '#FFEB3B', text: '#1A1A1A', background: '#FFF8FA' },
    fontPair: 'BOLD_SANS', tags: ['confetti', 'fun', 'kids'],
  },
  {
    id: 'tpl_bday_002', name: 'Sweet Sixteen',
    category: 'BIRTHDAY', layout: 'POSTER', animationStyle: 'SLIDE',
    colorSlots: { primary: '#E91E63', accent: '#F8BBD9', text: '#1A1A1A', background: '#FFF0F7' },
    fontPair: 'HANDWRITTEN', tags: ['sixteen', 'teen', 'glam'],
  },
  {
    id: 'tpl_bday_003', name: 'Silver Jubilee',
    category: 'BIRTHDAY', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#9E9E9E', accent: '#FDD835', text: '#212121', background: '#FAFAFA' },
    fontPair: 'DISPLAY_SERIF', tags: ['25th', 'silver', 'milestone'],
  },
  {
    id: 'tpl_bday_004', name: 'Golden 50',
    category: 'BIRTHDAY', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#BF953F', accent: '#FCF6BA', text: '#2C2C2C', background: '#1A1A1A' },
    fontPair: 'DISPLAY_SERIF', tags: ['50th', 'golden', 'elegant'],
  },
  {
    id: 'tpl_bday_005', name: 'Rainbow Blast',
    category: 'BIRTHDAY', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#FF4081', accent: '#40C4FF', text: '#1A1A1A', background: '#FFFFFF' },
    fontPair: 'BOLD_SANS', tags: ['rainbow', 'colorful', 'kids'],
  },
  {
    id: 'tpl_bday_006', name: 'Rooftop Party',
    category: 'BIRTHDAY', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#311B92', accent: '#E040FB', text: '#FFFFFF', background: '#0A0A20' },
    fontPair: 'BOLD_SANS', tags: ['rooftop', 'night', 'neon'],
  },
  {
    id: 'tpl_bday_007', name: 'Tropical Vibes',
    category: 'BIRTHDAY', layout: 'FULL_BLEED', animationStyle: 'FLOAT',
    colorSlots: { primary: '#00BCD4', accent: '#CDDC39', text: '#1A1A1A', background: '#E0F7FA' },
    fontPair: 'HANDWRITTEN', tags: ['tropical', 'summer', 'beach'],
  },
  {
    id: 'tpl_bday_008', name: 'Classic Black',
    category: 'BIRTHDAY', layout: 'MINIMAL', animationStyle: 'FADE',
    colorSlots: { primary: '#212121', accent: '#FDD835', text: '#FDD835', background: '#0A0A0A' },
    fontPair: 'MODERN_SANS', tags: ['black', 'adult', 'chic'],
  },
  {
    id: 'tpl_bday_009', name: 'Princess Party',
    category: 'BIRTHDAY', layout: 'CARD', animationStyle: 'FLOAT',
    colorSlots: { primary: '#F48FB1', accent: '#CE93D8', text: '#4A2C48', background: '#FFF3FC' },
    fontPair: 'SCRIPT_SERIF', tags: ['princess', 'pink', 'girls'],
  },
  {
    id: 'tpl_bday_010', name: 'Superhero Bash',
    category: 'BIRTHDAY', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#1565C0', accent: '#F44336', text: '#FDD835', background: '#0D1233' },
    fontPair: 'BOLD_SANS', tags: ['superhero', 'kids', 'comics'],
  },
  {
    id: 'tpl_bday_011', name: 'Vintage Fiesta',
    category: 'BIRTHDAY', layout: 'FULL_BLEED', animationStyle: 'SLIDE',
    colorSlots: { primary: '#BF360C', accent: '#FDD835', text: '#FFFFFF', background: '#4E0900' },
    fontPair: 'DISPLAY_SERIF', tags: ['vintage', 'fiesta', 'warm'],
  },
  {
    id: 'tpl_bday_012', name: 'Milky Way',
    category: 'BIRTHDAY', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#7E57C2', accent: '#B2EBF2', text: '#FFFFFF', background: '#0A0020' },
    fontPair: 'MODERN_SANS', tags: ['space', 'galaxy', 'cosmic'],
  },

  // ─── COLLEGE_FEST ─────────────────────────────────────────────
  {
    id: 'tpl_fest_001', name: 'Techfest',
    category: 'COLLEGE_FEST', layout: 'FULL_BLEED', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#00E676', accent: '#00B0FF', text: '#FFFFFF', background: '#050A0F' },
    fontPair: 'MONO_SANS', tags: ['tech', 'college', 'code'],
  },
  {
    id: 'tpl_fest_002', name: 'Cultural Night',
    category: 'COLLEGE_FEST', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FF6F00', accent: '#7B1FA2', text: '#FFFFFF', background: '#1A0A00' },
    fontPair: 'DISPLAY_SERIF', tags: ['cultural', 'dance', 'vibrant'],
  },
  {
    id: 'tpl_fest_003', name: 'Freshers Party',
    category: 'COLLEGE_FEST', layout: 'FULL_BLEED', animationStyle: 'FLOAT',
    colorSlots: { primary: '#F50057', accent: '#FFEA00', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'BOLD_SANS', tags: ['freshers', 'party', 'college'],
  },
  {
    id: 'tpl_fest_004', name: 'Sports Day',
    category: 'COLLEGE_FEST', layout: 'CARD', animationStyle: 'SLIDE',
    colorSlots: { primary: '#0288D1', accent: '#4CAF50', text: '#1A1A1A', background: '#E1F5FE' },
    fontPair: 'BOLD_SANS', tags: ['sports', 'athletics', 'outdoor'],
  },
  {
    id: 'tpl_fest_005', name: 'Annual Fest',
    category: 'COLLEGE_FEST', layout: 'MAGAZINE', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#6200EA', accent: '#FFD740', text: '#FFFFFF', background: '#2A0060' },
    fontPair: 'BOLD_SANS', tags: ['annual', 'fest', 'college'],
  },
  {
    id: 'tpl_fest_006', name: 'Battle of Bands',
    category: 'COLLEGE_FEST', layout: 'POSTER', animationStyle: 'ZOOM',
    colorSlots: { primary: '#212121', accent: '#FF1744', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'BOLD_SANS', tags: ['music', 'bands', 'rock'],
  },
  {
    id: 'tpl_fest_007', name: 'Literary Fest',
    category: 'COLLEGE_FEST', layout: 'MINIMAL', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#3E2723', accent: '#D7CCC8', text: '#3E2723', background: '#EFEBE9' },
    fontPair: 'SERIF_SANS', tags: ['literary', 'books', 'debate'],
  },

  // ─── CONCERT ──────────────────────────────────────────────────
  {
    id: 'tpl_concert_001', name: 'Mainstage',
    category: 'CONCERT', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#E040FB', accent: '#00E5FF', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'BOLD_SANS', tags: ['concert', 'stage', 'music'],
  },
  {
    id: 'tpl_concert_002', name: 'Unplugged',
    category: 'CONCERT', layout: 'MINIMAL', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#795548', accent: '#BCAAA4', text: '#3E2723', background: '#EFEBE9' },
    fontPair: 'HANDWRITTEN', tags: ['acoustic', 'intimate', 'folk'],
  },
  {
    id: 'tpl_concert_003', name: 'EDM Drop',
    category: 'CONCERT', layout: 'POSTER', animationStyle: 'FLOAT',
    colorSlots: { primary: '#FF1744', accent: '#FFEA00', text: '#FFFFFF', background: '#050510' },
    fontPair: 'BOLD_SANS', tags: ['edm', 'rave', 'electronic'],
  },
  {
    id: 'tpl_concert_004', name: 'Jazz Evening',
    category: 'CONCERT', layout: 'MAGAZINE', animationStyle: 'FADE',
    colorSlots: { primary: '#BF953F', accent: '#1A1A1A', text: '#FFFFFF', background: '#0A0A0A' },
    fontPair: 'DISPLAY_SERIF', tags: ['jazz', 'blues', 'soulful'],
  },
  {
    id: 'tpl_concert_005', name: 'Bollywood Night',
    category: 'CONCERT', layout: 'FULL_BLEED', animationStyle: 'ZOOM',
    colorSlots: { primary: '#FF6F00', accent: '#7B1FA2', text: '#FFFFFF', background: '#1A0030' },
    fontPair: 'DISPLAY_SERIF', tags: ['bollywood', 'filmy', 'vibrant'],
  },

  // ─── MARATHON ─────────────────────────────────────────────────
  {
    id: 'tpl_run_001', name: 'City Run',
    category: 'MARATHON', layout: 'POSTER', animationStyle: 'SLIDE',
    colorSlots: { primary: '#FF6D00', accent: '#FFFFFF', text: '#FFFFFF', background: '#1A0A00' },
    fontPair: 'BOLD_SANS', tags: ['marathon', 'run', 'city'],
  },
  {
    id: 'tpl_run_002', name: 'Trail Blazer',
    category: 'MARATHON', layout: 'FULL_BLEED', animationStyle: 'PARALLAX',
    colorSlots: { primary: '#2E7D32', accent: '#FDD835', text: '#FFFFFF', background: '#0A1A0A' },
    fontPair: 'BOLD_SANS', tags: ['trail', 'nature', 'endurance'],
  },
  {
    id: 'tpl_run_003', name: 'Charity 5K',
    category: 'MARATHON', layout: 'CARD', animationStyle: 'FADE',
    colorSlots: { primary: '#0288D1', accent: '#E1F5FE', text: '#01579B', background: '#FFFFFF' },
    fontPair: 'MODERN_SANS', tags: ['charity', '5k', 'community'],
  },
  {
    id: 'tpl_run_004', name: 'Ultra Endurance',
    category: 'MARATHON', layout: 'MINIMAL', animationStyle: 'TYPEWRITER',
    colorSlots: { primary: '#212121', accent: '#FF1744', text: '#212121', background: '#FAFAFA' },
    fontPair: 'MONO_SANS', tags: ['ultra', 'hardcore', 'minimal'],
  },
  {
    id: 'tpl_run_005', name: 'Sunrise 10K',
    category: 'MARATHON', layout: 'FULL_BLEED', animationStyle: 'FADE',
    colorSlots: { primary: '#FF7043', accent: '#FDD835', text: '#FFFFFF', background: '#4A1000' },
    fontPair: 'BOLD_SANS', tags: ['sunrise', '10k', 'morning'],
  },
];

export const TEMPLATE_MAP = new Map(TEMPLATES.map(t => [t.id, t]));

/** Returns the full template object or null if not found. */
export function getTemplate(id) {
  return TEMPLATE_MAP.get(id) ?? null;
}

/** Returns all templates, optionally filtered by category. */
export function listTemplates({ category, layout, animationStyle, search } = {}) {
  let list = TEMPLATES;
  if (category)       list = list.filter(t => t.category === category);
  if (layout)         list = list.filter(t => t.layout === layout);
  if (animationStyle) list = list.filter(t => t.animationStyle === animationStyle);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.includes(q)),
    );
  }
  return list;
}
