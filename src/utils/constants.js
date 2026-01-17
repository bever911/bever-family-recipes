// ============================================
// CONSTANTS
// ============================================

export const FAMILY_CODE = 'bluestar';

export const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Recipes', icon: '✦' },
  { id: 'breakfast', name: 'Breakfast', icon: '☀' },
  { id: 'main-course', name: 'Main Course', icon: '✦' },
  { id: 'side-dish', name: 'Sides', icon: '❋' },
  { id: 'dessert', name: 'Desserts', icon: '♡' },
  { id: 'pasta', name: 'Pasta', icon: '✦' },
  { id: 'soup', name: 'Soups', icon: '○' },
  { id: 'salad', name: 'Salads', icon: '❋' },
  { id: 'appetizer', name: 'Appetizers', icon: '✦' },
  { id: 'bread', name: 'Breads', icon: '○' },
  { id: 'beverage', name: 'Beverages', icon: '◇' },
  { id: 'other', name: 'Other', icon: '✦' },
];

export const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'a-z', name: 'A → Z' },
  { id: 'z-a', name: 'Z → A' },
  { id: 'category', name: 'By Category' },
];

export const STANDARD_UNITS = [
  'cup', 'cups',
  'Tbsp', 'tsp',
  'oz', 'lb',
  'g', 'kg', 'ml', 'liter',
  'pint', 'quart', 'gallon',
  'piece', 'slice', 'clove',
  'can', 'package', 'stick',
  'pinch', 'dash', 'sprig',
  'large', 'medium', 'small',
  'whole', 'bunch', 'head',
];

export const EMPTY_RECIPE = {
  id: '',
  title: '',
  category: '',
  author: '',
  authorIsFamily: true,
  servings: '',
  prepTime: '',
  cookTime: '',
  ingredients: [{ qty: '', unit: '', ingredient: '' }],
  instructions: [''],
  notes: '',
  story: '',
  imageUrl: '',
  imageCaption: '',
  handwrittenImageUrl: '',
  handwrittenImageCaption: '',
  sourceUrl: '', // NEW: Track where imported recipes came from
  dateAdded: '',
  trashedAt: null,
  comments: [],
  madeIt: [],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UNIT_MAPPINGS = {
  // Volume - Note: Tbsp is capitalized to visually distinguish from tsp
  'tablespoons': 'Tbsp', 'tablespoon': 'Tbsp', 'tbsps': 'Tbsp', 'tbs': 'Tbsp', 'T': 'Tbsp', 'tbsp': 'Tbsp',
  'teaspoons': 'tsp', 'teaspoon': 'tsp', 'tsps': 'tsp', 't': 'tsp', 't.': 'tsp',
  'cups': 'cup', 'c': 'cup', 'C': 'cup', 'c.': 'cup',
  'ounces': 'oz', 'ounce': 'oz', 'ozs': 'oz',
  'fluid ounces': 'fl oz', 'fluid ounce': 'fl oz', 'fl. oz.': 'fl oz', 'fl. oz': 'fl oz',
  'pints': 'pint', 'pt': 'pint', 'pts': 'pint',
  'quarts': 'quart', 'qt': 'quart', 'qts': 'quart',
  'gallons': 'gallon', 'gal': 'gallon', 'gals': 'gallon',
  'milliliters': 'ml', 'milliliter': 'ml', 'mls': 'ml', 'mL': 'ml',
  'liters': 'liter', 'litre': 'liter', 'litres': 'liter', 'l': 'liter', 'L': 'liter',
  // Weight
  'pounds': 'lb', 'pound': 'lb', 'lbs': 'lb', 'lb.': 'lb',
  'grams': 'g', 'gram': 'g', 'gr': 'g',
  'kilograms': 'kg', 'kilogram': 'kg', 'kgs': 'kg',
  // Count/Other
  'pieces': 'piece', 'pcs': 'piece', 'pc': 'piece',
  'slices': 'slice',
  'cloves': 'clove',
  'heads': 'head',
  'bunches': 'bunch',
  'cans': 'can',
  'packages': 'package', 'pkgs': 'package', 'pkg': 'package',
  'sticks': 'stick',
  'pinches': 'pinch',
  'dashes': 'dash',
  'sprigs': 'sprig',
  'stalks': 'stalk',
  'leaves': 'leaf',
  // Size descriptors
  'large': 'large', 'lg': 'large',
  'medium': 'medium', 'med': 'medium',
  'small': 'small', 'sm': 'small',
};

export const FRACTION_MAP = {
  '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 0.167, '⅚': 0.833, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  '1/2': 0.5, '1/3': 0.333, '2/3': 0.667, '1/4': 0.25, '3/4': 0.75,
  '1/8': 0.125, '3/8': 0.375, '5/8': 0.625, '7/8': 0.875,
};

export const UNITS_PATTERN = [
  'tablespoons?', 'tbsps?', 'tbs', 'T',
  'teaspoons?', 'tsps?', 't',
  'cups?', 'c',
  'ounces?', 'ozs?', 'oz',
  'fluid ounces?', 'fl\\.? ?oz\\.?',
  'pints?', 'pts?',
  'quarts?', 'qts?',
  'gallons?', 'gals?',
  'milliliters?', 'mls?', 'mL',
  'liters?', 'litres?', 'L', 'l',
  'pounds?', 'lbs?\\.?',
  'grams?', 'g', 'gr',
  'kilograms?', 'kgs?', 'kg',
  'pieces?', 'pcs?', 'pc',
  'slices?', 'cloves?', 'heads?', 'bunches?', 'bunch',
  'cans?', 'packages?', 'pkgs?', 'pkg',
  'sticks?', 'pinch(?:es)?', 'dash(?:es)?',
  'sprigs?', 'stalks?', 'leaves?', 'leaf',
  'large', 'lg', 'medium', 'med', 'small', 'sm',
].join('|');
