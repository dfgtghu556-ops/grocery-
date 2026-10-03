import type { AppState, InventoryItem, ReceiptSummary, ShoppingItem } from './types';

const receiptItem = (
  id: string,
  name: string,
  category: string,
  quantity: number,
  unit: string,
  priority: ShoppingItem['priority'],
  amount: number,
  receiptId: string,
  receiptLabel: string,
  extra: Partial<ShoppingItem> = {},
): ShoppingItem => ({
  id,
  name,
  category,
  quantity,
  unit,
  priority,
  // The photos do not identify either retailer clearly, so keep the source unassigned.
  source: 'other',
  estimatedPrice: amount,
  checked: false,
  frequencyMonths: 1,
  receiptId,
  receiptLabel,
  ...extra,
});

const receiptA = 'receipt-a';
const receiptB = 'receipt-b';
const receiptALabel = 'Receipt A · date not visible';
const receiptBLabel = 'Receipt B · 31 Aug 2026';

export const starterItems: ShoppingItem[] = [
  // Receipt A — 47 visible item lines. Amounts are transcribed from the line values;
  // several product names and the printed receipt total need a quick user review.
  receiptItem('henko-powder', 'Henko Stain Remover Powder', 'Cleaning', 1, '3 kg pack', 'important', 331.33, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('catch-garam-masala', 'Catch Garam Masala', 'Spices', 1, '100 g pack', 'important', 74.48, receiptA, receiptALabel),
  receiptItem('catch-sabji-masala', 'Catch Sabji Masala', 'Spices', 1, '100 g pack', 'important', 42.87, receiptA, receiptALabel),
  receiptItem('catch-kitchen-king', 'Catch Kitchen King', 'Spices', 1, 'pack', 'optional', 82.73, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('badshah-turmeric', 'Badshah Turmeric', 'Spices', 1, '100 g pack', 'essential', 24.60, receiptA, receiptALabel),
  receiptItem('napkin-tissue', 'Paper Napkin / Tissue', 'Household', 1, 'pack', 'important', 59.84, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('fa-talc', 'FA Talc', 'Personal care', 1, '400 g pack', 'optional', 126.57, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('bikano-rose-syrup', 'Bikano Rose Syrup', 'Breakfast', 1, '700 ml bottle', 'optional', 97.07, receiptA, receiptALabel),
  receiptItem('wonder-clean-rose', 'Wonder Clean Rose Perfume', 'Cleaning', 1, 'pack', 'optional', 86.57, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('dukes-coconut-cookies', 'Dukes Chocolate Coconut Cookies', 'Breakfast', 1, 'pack', 'optional', 34.61, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('wonder-clean-scrub-pad', 'Wonder Clean Scrub Pad', 'Cleaning', 1, 'pad', 'essential', 68.88, receiptA, receiptALabel),
  receiptItem('bambino-vermicelli', 'Bambino Roasted Vermicelli', 'Breakfast', 2, '400 g packs', 'important', 94.94, receiptA, receiptALabel),
  receiptItem('stayfree-xl', 'Stayfree Extra Large', 'Personal care', 2, '7-pad packs', 'important', 44.84, receiptA, receiptALabel),
  receiptItem('pam-foil', 'Aluminium Foil', 'Household', 1, '9 m roll', 'important', 83.17, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('lifebuoy-handwash', 'Lifebuoy Handwash Pouch', 'Personal care', 1, 'pouch', 'essential', 28.29, receiptA, receiptALabel),
  receiptItem('rin-whitener', 'Rin Fabric Whitener', 'Cleaning', 1, 'pack', 'important', 60.74, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('dabur-hajmola', 'Dabur Hajmola', 'Breakfast', 1, 'pack', 'optional', 47.99, receiptA, receiptALabel),
  receiptItem('wonder-clean-naphthalene', 'Wonder Clean Naphthalene Balls', 'Cleaning', 2, 'packs', 'important', 180.51, receiptA, receiptALabel),
  receiptItem('lipton-taaza', 'Lipton Taaza Tea', 'Breakfast', 3, '250 g packs', 'important', 113.25, receiptA, receiptALabel),
  receiptItem('tata-salt', 'Tata Salt', 'Grocery', 2, '1 kg packs', 'essential', 41.46, receiptA, receiptALabel),
  receiptItem('cinthol-deo-soap', 'Cinthol Deo Soap', 'Personal care', 1, '125 g pack', 'important', 90.77, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('cinthol-lime-soap', 'Cinthol Lime Soap', 'Personal care', 1, '125 g pack', 'important', 84.52, receiptA, receiptALabel),
  receiptItem('bikano-kaju-mix', 'Bikano Kaju Mix', 'Breakfast', 2, 'packs', 'optional', 103.14, receiptA, receiptALabel),
  receiptItem('cheese-cracker-biscuits', 'Cheese Cracker Biscuits', 'Breakfast', 2, 'packs', 'optional', 54.56, receiptA, receiptALabel),
  receiptItem('sunfeast-choco-fills', 'Sunfeast Choco Fills Biscuits', 'Breakfast', 1, 'pack', 'optional', 27.20, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('maggi-hot-sweet', 'Maggi Hot & Sweet Sauce', 'Breakfast', 1, 'bottle', 'optional', 73.71, receiptA, receiptALabel),
  receiptItem('good-day-pista', 'Good Day Pista Biscuits', 'Breakfast', 4, 'packs', 'optional', 77.80, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('vita-marie-gold', 'Britannia Vita Marie Gold', 'Breakfast', 2, 'packs', 'optional', 38.80, receiptA, receiptALabel),
  receiptItem('priya-gold-butter', 'Priya Gold Butter Biscuits', 'Breakfast', 2, 'packs', 'optional', 70.14, receiptA, receiptALabel),
  receiptItem('nestle-everyday', 'Nestlé Everyday', 'Dairy', 1, '400 g pack', 'important', 196.07, receiptA, receiptALabel),
  receiptItem('apna-rock-salt', 'Apna Brand Rock Salt', 'Grocery', 1, 'pack', 'important', 27.15, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('colgate-zigzag', 'Colgate Zig Zag Toothbrush', 'Personal care', 3, 'brushes', 'important', 36.06, receiptA, receiptALabel),
  receiptItem('steel-scrubber', 'Magic Stainless Steel Scrubber', 'Cleaning', 2, 'pieces', 'essential', 24.82, receiptA, receiptALabel),
  receiptItem('eno-pouch', 'Eno', 'Grocery', 1, '30 g pouch', 'important', 29.07, receiptA, receiptALabel),
  receiptItem('apna-soya-chunks', 'Apna Soya Chunks', 'Pulses', 1, 'pack', 'important', 42.68, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('harpic-bathroom-cleaner', 'Harpic Bathroom Cleaner', 'Cleaning', 1, '500 ml bottle', 'essential', 64.98, receiptA, receiptALabel),
  receiptItem('dove-shampoo', 'Dove Shampoo', 'Personal care', 1, '340 ml bottle', 'important', 222.95, receiptA, receiptALabel),
  receiptItem('saffola-masala-oats', 'Saffola Masala Oats · Coriander', 'Breakfast', 1, 'pack', 'important', 143.33, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('saffola-oats', 'Saffola Oats', 'Breakfast', 1, '400 g pack', 'important', 88.02, receiptA, receiptALabel),
  receiptItem('navratna-oil', 'Navratna Hair Oil', 'Personal care', 1, '200 ml bottle', 'optional', 92.02, receiptA, receiptALabel),
  receiptItem('parachute-coconut-oil', 'Parachute Coconut Oil', 'Cooking', 1, '1 L bottle', 'important', 297.04, receiptA, receiptALabel),
  receiptItem('par-jasmine', 'Parachute Jasmine Oil', 'Personal care', 1, '300 ml bottle', 'optional', 78.16, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('britannia-tostea', 'Britannia Tostea', 'Breakfast', 2, '200 g packs', 'optional', 61.92, receiptA, receiptALabel),
  receiptItem('catch-coriander', 'Catch Coriander Powder', 'Spices', 2, '200 g packs', 'important', 119.60, receiptA, receiptALabel),
  receiptItem('chukde-saunf', 'Chukde Moti Saunf', 'Spices', 1, 'pack', 'optional', 71.78, receiptA, receiptALabel, { reviewRequired: true }),
  receiptItem('lakme-lotion', 'Lakmé Moisturising Lotion', 'Personal care', 2, 'packs', 'optional', 294.80, receiptA, receiptALabel),
  receiptItem('namaste-india-ghee', 'Namaste India Desi Ghee', 'Cooking', 1, '1 L pack', 'important', 660.81, receiptA, receiptALabel),

  // Receipt B — the printed tax invoice identifies 26 lines, dated 31 Aug 2026.
  receiptItem('malai-paneer', 'Malai Paneer', 'Dairy', 1, '200 g pack', 'important', 94.00, receiptB, receiptBLabel),
  receiptItem('rajma-chitra', 'Loose Rajma Chitra', 'Pulses', 0.538, 'kg', 'important', 68.86, receiptB, receiptBLabel),
  receiptItem('moong-dal', 'Loose Moong Dal', 'Pulses', 0.514, 'kg', 'essential', 57.57, receiptB, receiptBLabel),
  receiptItem('poha-mota', 'Loose Poha Mota', 'Grocery', 1.014, 'kg', 'important', 59.83, receiptB, receiptBLabel),
  receiptItem('kabuli-chana', 'Loose Kabuli Chana', 'Pulses', 0.996, 'kg', 'important', 80.68, receiptB, receiptBLabel),
  receiptItem('toor-dal', 'Loose Toor Dal', 'Pulses', 0.502, 'kg', 'essential', 60.74, receiptB, receiptBLabel),
  receiptItem('phool-makhana', 'Loose Phool Makhana', 'Breakfast', 0.290, 'kg', 'optional', 297.25, receiptB, receiptBLabel),
  receiptItem('chana-dal', 'Loose Chana Dal', 'Pulses', 0.998, 'kg', 'essential', 80.84, receiptB, receiptBLabel),
  receiptItem('good-life-cashews', 'Good Life M320 Cashews', 'Breakfast', 1, '200 g pack', 'optional', 226.68, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('good-life-sooji', 'Good Life Sooji', 'Grocery', 2, '500 g packs', 'important', 50.00, receiptB, receiptBLabel),
  receiptItem('good-life-maida', 'Good Life Maida', 'Grocery', 1, '1 kg pack', 'optional', 50.00, receiptB, receiptBLabel),
  receiptItem('loose-sugar', 'Loose Sugar', 'Grocery', 1.074, 'kg', 'essential', 66.59, receiptB, receiptBLabel),
  receiptItem('refined-oil', 'Refined Oil', 'Cooking', 2, '750 g packs', 'essential', 262.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('almonds', 'Almonds', 'Breakfast', 1, '500 g pack', 'important', 509.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('good-life-sabudana', 'Good Life Sabudana', 'Grocery', 1, '500 g pack', 'important', 45.00, receiptB, receiptBLabel),
  receiptItem('california-nuts', 'California Nuts', 'Breakfast', 1, '100 g pack', 'optional', 170.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('raw-peanuts', 'Loose Raw Peanuts', 'Breakfast', 2.018, 'kg', 'important', 324.89, receiptB, receiptBLabel),
  receiptItem('white-peas', 'White Peas', 'Pulses', 1, '500 g pack', 'important', 80.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('dr-mishri', 'DR Brand Mishri', 'Grocery', 1, '200 g pack', 'optional', 31.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('raisins', 'Raisins', 'Breakfast', 1, '200 g pack', 'important', 115.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('good-life-rose', 'Good Life Rose Raisins', 'Breakfast', 2, '100 g packs', 'optional', 70.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('kanaiya-murmura', 'Kanaiya Murmura', 'Breakfast', 1, '500 g pack', 'optional', 52.00, receiptB, receiptBLabel),
  receiptItem('atta-5kg', 'Atta', 'Grocery', 1, '5 kg pack', 'essential', 263.00, receiptB, receiptBLabel, { brand: 'Gold brand', reviewRequired: true }),
  receiptItem('golf-chakki-atta', 'Golf Chakki Atta', 'Grocery', 1, '10 kg pack', 'essential', 369.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('glass-set', 'Glass Set', 'Household', 1, 'set of 2', 'optional', 179.00, receiptB, receiptBLabel, { reviewRequired: true }),
  receiptItem('heli-glass', 'Glass', 'Household', 3, '145 ml pieces', 'optional', 63.00, receiptB, receiptBLabel, { reviewRequired: true }),
];

export const receiptSummaries: ReceiptSummary[] = [
  {
    id: receiptA,
    label: 'Receipt A',
    date: 'Date not visible',
    store: 'Store name not visible',
    itemCount: 47,
    lineTotal: 4896.64,
    note: 'Line prices were transcribed from the photo. The printed total and a few product names are difficult to read, so review flagged items before relying on them.',
  },
  {
    id: receiptB,
    label: 'Receipt B',
    date: '31 Aug 2026',
    store: 'Store code UTBA · retailer name unclear',
    itemCount: 26,
    gross: 4560.18,
    discount: 834.25,
    lineTotal: 3725.93,
    note: 'Printed invoice total is ₹3,725.93 after ₹834.25 savings. Some short product names were expanded for readability and flagged for review.',
  },
];

export const starterInventory: InventoryItem[] = [];

export const defaultState: AppState = {
  budget: 20000,
  bufferPercent: 10,
  household: { name: 'My household', members: 3, adults: 2, children: 1, seniors: 0 },
  items: starterItems,
  inventory: starterInventory,
  rules: [],
  categoryBudgets: { Food: 52, 'Fresh produce': 16, Household: 12, 'Personal care': 10, Buffer: 10 },
  shoppingArea: 'Delhi',
  postalCode: '',
  preferredOnlineStore: 'JioMart',
  month: 'October 2026',
};

export const categories = [
  'Grocery', 'Pulses', 'Cooking', 'Spices', 'Dairy', 'Breakfast', 'Vegetables', 'Fruits', 'Personal care', 'Cleaning', 'Household', 'Baby & child', 'Pet care', 'Home maintenance', 'First aid',
];
