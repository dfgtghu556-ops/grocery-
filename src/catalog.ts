import type { Priority } from './types';

export interface HouseholdCatalogEntry {
  id: string;
  name: string;
  group: string;
  category: string;
  quantity: number;
  unit: string;
  priority: Priority;
  frequencyMonths: number;
  note?: string;
}

const item = (
  id: string,
  name: string,
  group: string,
  category: string,
  unit: string,
  priority: Priority = 'important',
  note?: string,
  frequencyMonths = 1,
): HouseholdCatalogEntry => ({ id, name, group, category, quantity: 1, unit, priority, frequencyMonths, ...(note ? { note } : {}) });

// Optional reminders only: none of these are put in the receipt list or monthly plan
// until the user selects them. Prices are deliberately blank rather than fabricated.
export const householdCatalog: HouseholdCatalogEntry[] = [
  // Everyday pantry, grains and breakfast basics
  item('rice', 'Rice', 'Pantry & grains', 'Grocery', 'kg', 'essential'),
  item('atta', 'Whole-wheat atta', 'Pantry & grains', 'Grocery', 'kg', 'essential'),
  item('basmati-rice', 'Basmati rice', 'Pantry & grains', 'Grocery', 'kg', 'important'),
  item('poha', 'Poha', 'Pantry & grains', 'Grocery', 'kg'),
  item('sooji', 'Sooji / semolina', 'Pantry & grains', 'Grocery', 'kg'),
  item('besan', 'Besan / gram flour', 'Pantry & grains', 'Grocery', 'kg'),
  item('maida', 'Maida / plain flour', 'Pantry & grains', 'Grocery', 'kg', 'optional'),
  item('oats', 'Plain oats', 'Pantry & grains', 'Breakfast', 'pack'),
  item('bread', 'Bread', 'Pantry & grains', 'Breakfast', 'loaf', 'important'),
  item('vermicelli', 'Vermicelli / seviyan', 'Pantry & grains', 'Breakfast', 'pack'),
  item('pasta', 'Pasta / macaroni', 'Pantry & grains', 'Grocery', 'pack', 'optional'),
  item('noodles', 'Noodles', 'Pantry & grains', 'Breakfast', 'pack', 'optional'),
  item('breakfast-cereal', 'Breakfast cereal', 'Pantry & grains', 'Breakfast', 'pack', 'optional', 'Choose only if your household eats it.'),
  item('sugar', 'Sugar', 'Pantry & grains', 'Grocery', 'kg', 'essential'),
  item('jaggery', 'Jaggery / gur', 'Pantry & grains', 'Grocery', 'kg', 'optional'),
  item('iodized-salt', 'Iodized salt', 'Pantry & grains', 'Grocery', 'kg', 'essential'),
  item('tea', 'Tea', 'Pantry & grains', 'Breakfast', 'pack', 'important'),
  item('coffee', 'Coffee', 'Pantry & grains', 'Breakfast', 'pack', 'optional', 'Choose tea, coffee, both, or neither to suit your household.'),

  // Pulses and protein foods
  item('toor-dal', 'Toor / arhar dal', 'Pulses & protein', 'Pulses', 'kg', 'essential'),
  item('moong-dal', 'Moong dal', 'Pulses & protein', 'Pulses', 'kg', 'important'),
  item('masoor-dal', 'Masoor dal', 'Pulses & protein', 'Pulses', 'kg', 'important'),
  item('chana-dal', 'Chana dal', 'Pulses & protein', 'Pulses', 'kg', 'important'),
  item('urad-dal', 'Urad dal', 'Pulses & protein', 'Pulses', 'kg', 'optional'),
  item('rajma', 'Rajma', 'Pulses & protein', 'Pulses', 'kg', 'important'),
  item('chickpeas', 'Chickpeas / chole', 'Pulses & protein', 'Pulses', 'kg', 'important'),
  item('black-chana', 'Kala chana', 'Pulses & protein', 'Pulses', 'kg', 'optional'),
  item('white-peas', 'White peas / matar', 'Pulses & protein', 'Pulses', 'kg', 'optional'),
  item('soya-chunks', 'Soya chunks', 'Pulses & protein', 'Pulses', 'pack', 'optional'),
  item('peanuts', 'Peanuts', 'Pulses & protein', 'Pulses', 'kg', 'optional'),
  item('eggs', 'Eggs', 'Pulses & protein', 'Dairy', 'dozen', 'optional', 'Only if eaten; keep chilled and follow food-safety guidance.'),
  item('chicken', 'Chicken / preferred fresh protein', 'Pulses & protein', 'Grocery', 'kg', 'optional', 'Only if eaten; buy fresh from a trusted local source.'),

  // Cooking fats, spices and condiments
  item('cooking-oil', 'Cooking oil', 'Cooking & spices', 'Cooking', 'L', 'essential'),
  item('mustard-oil', 'Mustard oil', 'Cooking & spices', 'Cooking', 'L', 'optional'),
  item('ghee', 'Ghee', 'Cooking & spices', 'Cooking', 'kg', 'important'),
  item('turmeric', 'Turmeric powder', 'Cooking & spices', 'Spices', 'pack', 'essential'),
  item('red-chilli', 'Red chilli powder', 'Cooking & spices', 'Spices', 'pack', 'important'),
  item('coriander-powder', 'Coriander powder', 'Cooking & spices', 'Spices', 'pack', 'important'),
  item('cumin-seeds', 'Cumin seeds / jeera', 'Cooking & spices', 'Spices', 'pack', 'important'),
  item('mustard-seeds', 'Mustard seeds / rai', 'Cooking & spices', 'Spices', 'pack'),
  item('garam-masala', 'Garam masala', 'Cooking & spices', 'Spices', 'pack'),
  item('black-pepper', 'Black pepper', 'Cooking & spices', 'Spices', 'pack', 'optional'),
  item('hing', 'Hing / asafoetida', 'Cooking & spices', 'Spices', 'pack', 'optional'),
  item('amchur', 'Amchur / dry mango powder', 'Cooking & spices', 'Spices', 'pack', 'optional'),
  item('tomato-ketchup', 'Tomato ketchup', 'Cooking & spices', 'Breakfast', 'bottle', 'optional'),
  item('vinegar', 'Vinegar', 'Cooking & spices', 'Cooking', 'bottle', 'optional'),

  // Fresh produce: select what is actually used and buy to match the week
  item('potatoes', 'Potatoes', 'Fresh vegetables', 'Vegetables', 'kg', 'essential'),
  item('onions', 'Onions', 'Fresh vegetables', 'Vegetables', 'kg', 'essential'),
  item('tomatoes', 'Tomatoes', 'Fresh vegetables', 'Vegetables', 'kg', 'essential'),
  item('garlic', 'Garlic', 'Fresh vegetables', 'Vegetables', '250 g', 'important', 'Optional starter suggestion; not present in either imported receipt.'),
  item('ginger', 'Ginger', 'Fresh vegetables', 'Vegetables', '250 g', 'important'),
  item('green-chilli', 'Green chillies', 'Fresh vegetables', 'Vegetables', '250 g', 'optional'),
  item('coriander-leaves', 'Fresh coriander leaves', 'Fresh vegetables', 'Vegetables', 'bunch', 'optional'),
  item('lemons', 'Lemons', 'Fresh vegetables', 'Fruits', 'pieces', 'optional'),
  item('spinach', 'Spinach / seasonal greens', 'Fresh vegetables', 'Vegetables', 'bunch', 'important'),
  item('carrots', 'Carrots', 'Fresh vegetables', 'Vegetables', 'kg', 'important'),
  item('cauliflower', 'Cauliflower / seasonal vegetable', 'Fresh vegetables', 'Vegetables', 'piece', 'important'),
  item('cucumber', 'Cucumber', 'Fresh vegetables', 'Vegetables', 'kg', 'optional'),
  item('capsicum', 'Capsicum', 'Fresh vegetables', 'Vegetables', 'kg', 'optional'),
  item('seasonal-vegetables', 'Other seasonal vegetables', 'Fresh vegetables', 'Vegetables', 'kg', 'important', 'Use this for the vegetables your household prefers this week.'),

  // Fruit and chilled foods
  item('bananas', 'Bananas', 'Fruit & dairy', 'Fruits', 'dozen', 'important'),
  item('apples', 'Apples', 'Fruit & dairy', 'Fruits', 'kg', 'optional'),
  item('seasonal-fruit', 'Other seasonal fruit', 'Fruit & dairy', 'Fruits', 'kg', 'important', 'Choose locally available fruit; quantity is seasonal.'),
  item('milk', 'Milk', 'Fruit & dairy', 'Dairy', 'L', 'essential'),
  item('curd', 'Curd / dahi', 'Fruit & dairy', 'Dairy', 'kg', 'important'),
  item('paneer', 'Paneer', 'Fruit & dairy', 'Dairy', 'pack', 'optional'),
  item('butter', 'Butter', 'Fruit & dairy', 'Dairy', 'pack', 'optional'),
  item('cheese', 'Cheese', 'Fruit & dairy', 'Dairy', 'pack', 'optional'),
  item('yogurt', 'Yogurt', 'Fruit & dairy', 'Dairy', 'pack', 'optional'),

  // Snacks and drinks
  item('biscuits', 'Biscuits', 'Snacks & drinks', 'Breakfast', 'pack', 'optional'),
  item('rusk', 'Rusk / toast', 'Snacks & drinks', 'Breakfast', 'pack', 'optional'),
  item('namkeen', 'Namkeen / savoury snack', 'Snacks & drinks', 'Breakfast', 'pack', 'optional'),
  item('nuts', 'Nuts / dry-fruit mix', 'Snacks & drinks', 'Breakfast', 'pack', 'optional'),
  item('raisins', 'Raisins / kishmish', 'Snacks & drinks', 'Breakfast', 'pack', 'optional'),
  item('jam', 'Jam or honey', 'Snacks & drinks', 'Breakfast', 'jar', 'optional'),
  item('juice', 'Juice / drink of choice', 'Snacks & drinks', 'Breakfast', 'pack', 'optional'),
  item('drinking-water', 'Packaged drinking water', 'Snacks & drinks', 'Household', 'bottle', 'optional', 'Only if your household normally buys it.'),

  // Dishwashing, laundry and cleaning
  item('dishwash-liquid', 'Dishwashing liquid / bar', 'Cleaning & laundry', 'Cleaning', 'pack', 'essential'),
  item('laundry-detergent', 'Laundry detergent', 'Cleaning & laundry', 'Cleaning', 'pack', 'essential'),
  item('laundry-bar', 'Laundry soap bar', 'Cleaning & laundry', 'Cleaning', 'bar', 'optional'),
  item('floor-cleaner', 'Floor cleaner', 'Cleaning & laundry', 'Cleaning', 'bottle', 'important'),
  item('toilet-cleaner', 'Toilet cleaner', 'Cleaning & laundry', 'Cleaning', 'bottle', 'important'),
  item('bathroom-cleaner', 'Bathroom cleaner', 'Cleaning & laundry', 'Cleaning', 'bottle', 'important'),
  item('surface-cleaner', 'General surface cleaner', 'Cleaning & laundry', 'Cleaning', 'bottle', 'optional'),
  item('sponges', 'Cleaning sponges / scrub pads', 'Cleaning & laundry', 'Cleaning', 'pack', 'important'),
  item('steel-scrubbers', 'Steel scrubbers', 'Cleaning & laundry', 'Cleaning', 'pack', 'optional'),
  item('broom', 'Broom', 'Cleaning & laundry', 'Household', 'piece', 'important', 'Replace only when needed.', 6),
  item('mop-refill', 'Mop head / refill', 'Cleaning & laundry', 'Household', 'piece', 'optional', 'Replace only when needed.', 6),
  item('laundry-softener', 'Fabric conditioner / whitener', 'Cleaning & laundry', 'Cleaning', 'bottle', 'optional'),
  item('garbage-bags', 'Garbage bags', 'Cleaning & laundry', 'Household', 'roll', 'important'),
  item('cleaning-gloves', 'Reusable cleaning gloves', 'Cleaning & laundry', 'Household', 'pair', 'optional'),

  // Kitchen consumables and everyday home supplies
  item('tissues', 'Tissues / paper napkins', 'Kitchen & home', 'Household', 'pack', 'important'),
  item('paper-towels', 'Kitchen paper towels', 'Kitchen & home', 'Household', 'roll', 'optional'),
  item('aluminium-foil', 'Aluminium foil', 'Kitchen & home', 'Household', 'roll', 'optional'),
  item('cling-film', 'Cling film / food wrap', 'Kitchen & home', 'Household', 'roll', 'optional'),
  item('food-storage-bags', 'Food-storage bags / containers', 'Kitchen & home', 'Household', 'pack', 'optional'),
  item('matches-lighter', 'Matches / gas lighter', 'Kitchen & home', 'Household', 'piece', 'important', 'Keep away from children and heat sources.'),
  item('dishcloths', 'Kitchen cloths', 'Kitchen & home', 'Household', 'pack', 'optional'),
  item('water-filter', 'Water-filter candle / cartridge', 'Kitchen & home', 'Household', 'piece', 'optional', 'Only if your filter model requires it; check compatibility.', 3),
  item('lpg-refill', 'LPG / cooking-gas refill', 'Kitchen & home', 'Household', 'cylinder', 'essential', 'Add only if this household pays for its own refill; price can vary.', 2),
  item('light-bulbs', 'LED light bulbs', 'Kitchen & home', 'Home maintenance', 'piece', 'optional', 'Replace only when needed.', 6),
  item('batteries', 'Household batteries', 'Kitchen & home', 'Home maintenance', 'pack', 'optional', 'Choose the size your devices need; replace only when needed.', 3),

  // Personal hygiene and care
  item('handwash', 'Handwash refill', 'Personal care', 'Personal care', 'pouch', 'important'),
  item('bath-soap', 'Bath soap / body wash', 'Personal care', 'Personal care', 'pack', 'essential'),
  item('toothpaste', 'Toothpaste', 'Personal care', 'Personal care', 'tube', 'essential'),
  item('toothbrushes', 'Toothbrushes', 'Personal care', 'Personal care', 'pieces', 'important'),
  item('shampoo', 'Shampoo', 'Personal care', 'Personal care', 'bottle', 'important'),
  item('conditioner', 'Hair conditioner', 'Personal care', 'Personal care', 'bottle', 'optional'),
  item('deodorant', 'Deodorant', 'Personal care', 'Personal care', 'piece', 'optional'),
  item('moisturiser', 'Moisturiser / lotion', 'Personal care', 'Personal care', 'bottle', 'optional'),
  item('sanitary-products', 'Sanitary products', 'Personal care', 'Personal care', 'pack', 'important', 'Choose the products and quantity that suit the person using them.'),
  item('shaving-items', 'Shaving items', 'Personal care', 'Personal care', 'pack', 'optional', 'Only if used by someone in the household.'),
  item('combs', 'Combs / hair ties', 'Personal care', 'Personal care', 'pack', 'optional', 'Replace only when needed.', 6),
  item('adult-incontinence', 'Adult care products', 'Personal care', 'Personal care', 'pack', 'optional', 'Only if needed; choose privately and according to the user’s preference.'),

  // Safety and first-aid reminders. These are not medical advice.
  item('first-aid-kit', 'First-aid kit refill', 'First aid & safety', 'First aid', 'kit', 'important', 'Check contents, expiry dates and suitability; ask a clinician or pharmacist about medicines.', 6),
  item('bandages', 'Adhesive bandages / plasters', 'First aid & safety', 'First aid', 'pack', 'optional'),
  item('antiseptic', 'Antiseptic wound-care product', 'First aid & safety', 'First aid', 'bottle', 'optional', 'Follow the product label and professional advice.'),
  item('thermometer', 'Digital thermometer', 'First aid & safety', 'First aid', 'piece', 'optional', 'One-time household item; check batteries and instructions.', 24),
  item('mosquito-repellent', 'Mosquito repellent', 'First aid & safety', 'Household', 'pack', 'optional', 'Choose a product suitable for household members and follow its label.'),

  // Optional: include only when relevant to your family
  item('diapers', 'Baby diapers', 'Baby & child · if needed', 'Baby & child', 'pack', 'important', 'Only if needed; size and monthly quantity vary.', 1),
  item('baby-wipes', 'Baby wipes', 'Baby & child · if needed', 'Baby & child', 'pack', 'optional', 'Only if needed.'),
  item('baby-wash', 'Baby wash / care item', 'Baby & child · if needed', 'Baby & child', 'bottle', 'optional', 'Only if needed; follow age and clinician guidance.'),
  item('school-supplies', 'School stationery', 'Baby & child · if needed', 'Baby & child', 'set', 'optional', 'Only if a child in the household needs it; update for the school term.', 3),
  item('pet-food', 'Pet food', 'Pet care · if needed', 'Pet care', 'pack', 'important', 'Only if you have a pet; choose food appropriate for the animal.'),
  item('pet-litter', 'Pet litter / bedding', 'Pet care · if needed', 'Pet care', 'pack', 'optional', 'Only for pets that need it.'),
  item('pet-waste-bags', 'Pet waste bags', 'Pet care · if needed', 'Pet care', 'roll', 'optional', 'Only if needed.'),
  item('pet-grooming', 'Pet grooming supplies', 'Pet care · if needed', 'Pet care', 'pack', 'optional', 'Only if needed; consult a vet for medicated products.'),
];

export const householdCatalogGroups = [...new Set(householdCatalog.map((entry) => entry.group))];
