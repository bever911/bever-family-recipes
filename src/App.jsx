import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// ============================================
// BEVER FAMILY RECIPES
// Magnolia-inspired design with enhanced features
// ============================================

// ============================================
// FIREBASE CONFIG
// ============================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA0ZCgyjVAqKBDbR9-iiUb8bVyH7UijiDo",
  authDomain: "bever-family-recipes.firebaseapp.com",
  projectId: "bever-family-recipes",
  storageBucket: "bever-family-recipes.firebasestorage.app",
  messagingSenderId: "609429863508",
  appId: "1:609429863508:web:aee0811bd4c8757d2501c1"
};

// Initialize Firebase
const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
const getLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_CATEGORIES = [
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

const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'a-z', name: 'A → Z' },
  { id: 'z-a', name: 'Z → A' },
  { id: 'category', name: 'By Category' },
];

const EMPTY_RECIPE = {
  id: '',
  title: '',
  category: '',
  author: '',
  authorIsFamily: true, // Default to family member
  servings: '',
  prepTime: '',
  cookTime: '',
  ingredients: [{ amount: '', ingredient: '' }],
  instructions: [''],
  notes: '',
  story: '', // NEW: Story/history behind recipe
  imageUrl: '',
  handwrittenImageUrl: '', // NEW: Original handwritten recipe card
  dateAdded: '',
  comments: [],
  madeIt: [], // NEW: Array of {name, date}
};

// Target aspect ratio for images (4:3)
const TARGET_ASPECT_RATIO = 4 / 3;

// ============================================
// UNIT NORMALIZATION
// ============================================
const UNIT_MAPPINGS = {
  // Volume
  'tablespoons': 'tbsp', 'tablespoon': 'tbsp', 'tbsps': 'tbsp', 'tbs': 'tbsp', 'T': 'tbsp',
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

const normalizeUnit = (unit) => {
  if (!unit) return '';
  const trimmed = unit.trim().toLowerCase();
  return UNIT_MAPPINGS[trimmed] || UNIT_MAPPINGS[unit.trim()] || unit.trim();
};

// ============================================
// INGREDIENT PARSING
// ============================================
const FRACTION_MAP = {
  '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 0.167, '⅚': 0.833, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  '1/2': 0.5, '1/3': 0.333, '2/3': 0.667, '1/4': 0.25, '3/4': 0.75,
  '1/8': 0.125, '3/8': 0.375, '5/8': 0.625, '7/8': 0.875,
};

const UNITS_PATTERN = [
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

const parseIngredientString = (str) => {
  if (!str || typeof str !== 'string') return { quantity: '', unit: '', item: str || '' };
  
  const original = str.trim();
  let remaining = original;
  let quantity = '';
  let unit = '';
  let item = '';
  
  // Try to match quantity patterns in order of specificity:
  
  // Pattern 1: Mixed number with space "2 1/2" or "2 3/4"
  const mixedSpaceMatch = remaining.match(/^(\d+)\s+([1-9]\/[1-9])\s*/);
  // Pattern 2: Mixed number with unicode "2½"
  const mixedUnicodeMatch = remaining.match(/^(\d+)([\u00BC-\u00BE\u2150-\u215E])\s*/);
  // Pattern 3: Simple fraction "1/2" (must check BEFORE plain number)
  const simpleFractionMatch = remaining.match(/^([1-9]\/[1-9])\s*/);
  // Pattern 4: Unicode fraction "½"
  const unicodeFractionMatch = remaining.match(/^([\u00BC-\u00BE\u2150-\u215E])\s*/);
  // Pattern 5: Decimal or whole number "2.5" or "2"
  const numberMatch = remaining.match(/^(\d+(?:\.\d+)?)\s*/);
  
  if (mixedSpaceMatch) {
    // "2 1/2" -> 2.5
    const whole = parseFloat(mixedSpaceMatch[1]);
    const frac = FRACTION_MAP[mixedSpaceMatch[2]] || 0;
    quantity = whole + frac;
    remaining = remaining.slice(mixedSpaceMatch[0].length).trim();
  } else if (mixedUnicodeMatch) {
    // "2½" -> 2.5
    const whole = parseFloat(mixedUnicodeMatch[1]);
    const frac = FRACTION_MAP[mixedUnicodeMatch[2]] || 0;
    quantity = whole + frac;
    remaining = remaining.slice(mixedUnicodeMatch[0].length).trim();
  } else if (simpleFractionMatch) {
    // "1/2" -> 0.5
    quantity = FRACTION_MAP[simpleFractionMatch[1]] || simpleFractionMatch[1];
    remaining = remaining.slice(simpleFractionMatch[0].length).trim();
  } else if (unicodeFractionMatch) {
    // "½" -> 0.5
    quantity = FRACTION_MAP[unicodeFractionMatch[1]] || unicodeFractionMatch[1];
    remaining = remaining.slice(unicodeFractionMatch[0].length).trim();
  } else if (numberMatch) {
    // "2" or "2.5"
    quantity = parseFloat(numberMatch[1]);
    remaining = remaining.slice(numberMatch[0].length).trim();
  }
  
  // Match unit
  const unitRegex = new RegExp(`^(${UNITS_PATTERN})\\.?\\s*`, 'i');
  const unitMatch = remaining.match(unitRegex);
  
  if (unitMatch) {
    unit = normalizeUnit(unitMatch[1]);
    remaining = remaining.slice(unitMatch[0].length).trim();
  }
  
  // Everything else is the item
  item = remaining;
  
  return { quantity: quantity.toString(), unit, item };
};

const formatIngredient = (parsed) => {
  const parts = [];
  if (parsed.quantity) parts.push(parsed.quantity);
  if (parsed.unit) parts.push(parsed.unit);
  if (parsed.item) parts.push(parsed.item);
  return parts.join(' ');
};

// ============================================
// METADATA INFERENCE
// ============================================
const TIME_PATTERNS = [
  /(?:bake|cook|roast|simmer|boil|fry|sauté|grill|broil|steam)\s+(?:for\s+)?(?:about\s+)?(\d+)\s*(?:to|-)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)/i,
  /(?:bake|cook|roast|simmer|boil|fry|sauté|grill|broil|steam)\s+(?:for\s+)?(?:about\s+)?(\d+)\s*(minutes?|mins?|hours?|hrs?)/i,
  /(\d+)\s*(?:to|-)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)\s+(?:or\s+)?(?:until)/i,
  /(\d+)\s*(minutes?|mins?|hours?|hrs?)\s+(?:or\s+)?(?:until)/i,
  /(?:for\s+)(\d+)\s*(?:to|-)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)/i,
  /(?:for\s+)(\d+)\s*(minutes?|mins?|hours?|hrs?)/i,
];

const extractCookTimeFromInstructions = (instructions) => {
  if (!instructions || !Array.isArray(instructions)) return null;
  
  const allText = instructions.join(' ');
  
  for (const pattern of TIME_PATTERNS) {
    const match = allText.match(pattern);
    if (match) {
      const isHours = /hours?|hrs?/i.test(match[match.length - 1]);
      
      if (match[2] && !isNaN(match[2]) && match[1] && !isNaN(match[1])) {
        // Range like "20-25 minutes"
        const avg = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        return isHours ? `${avg} hours` : `${avg} min`;
      } else if (match[1] && !isNaN(match[1])) {
        // Single value
        const time = parseInt(match[1]);
        return isHours ? `${time} hour${time > 1 ? 's' : ''}` : `${time} min`;
      }
    }
  }
  
  return null;
};

// ============================================
// IMAGE PROCESSING
// ============================================
const processImageForUpload = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      const srcWidth = img.width;
      const srcHeight = img.height;
      const srcRatio = srcWidth / srcHeight;
      
      // Target dimensions (max 1200px wide, maintain 4:3 ratio)
      const maxWidth = 1200;
      const targetWidth = Math.min(srcWidth, maxWidth);
      const targetHeight = targetWidth / TARGET_ASPECT_RATIO;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Fill with a subtle background color for letterboxing
      ctx.fillStyle = '#f5f3ef';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (srcRatio > TARGET_ASPECT_RATIO) {
        // Image is wider than target - fit to width, letterbox top/bottom
        drawWidth = targetWidth;
        drawHeight = targetWidth / srcRatio;
        drawX = 0;
        drawY = (targetHeight - drawHeight) / 2;
      } else {
        // Image is taller than target - fit to height, letterbox sides
        drawHeight = targetHeight;
        drawWidth = targetHeight * srcRatio;
        drawX = (targetWidth - drawWidth) / 2;
        drawY = 0;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        } else {
          reject(new Error('Failed to process image'));
        }
      }, 'image/jpeg', 0.85);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// ============================================
// AUTHOR FORMATTING
// ============================================
const formatAuthorDisplay = (author, isFamily) => {
  if (!author) return '';
  
  // Get first name for warmer feel
  const firstName = author.split(' ')[0];
  
  if (isFamily !== false) {
    // Family recipes get warm formatting
    return `From ${firstName}'s Kitchen`;
  } else {
    // External sources (cookbooks, websites)
    return `Recipe from ${author}`;
  }
};

// ============================================
// SCALE INGREDIENTS
// ============================================
const scaleIngredientAmount = (amount, multiplier) => {
  if (!amount) return amount;
  
  // Try to extract number from amount
  const numMatch = amount.match(/^([\d.\/]+)/);
  if (!numMatch) return amount;
  
  let num = numMatch[1];
  
  // Handle fractions
  if (num.includes('/')) {
    const [a, b] = num.split('/').map(Number);
    num = a / b;
  } else {
    num = parseFloat(num);
  }
  
  if (isNaN(num)) return amount;
  
  const scaled = num * multiplier;
  
  // Format nicely
  let formatted;
  if (scaled === Math.floor(scaled)) {
    formatted = scaled.toString();
  } else if (Math.abs(scaled - 0.25) < 0.01) {
    formatted = '1/4';
  } else if (Math.abs(scaled - 0.333) < 0.01) {
    formatted = '1/3';
  } else if (Math.abs(scaled - 0.5) < 0.01) {
    formatted = '1/2';
  } else if (Math.abs(scaled - 0.667) < 0.01) {
    formatted = '2/3';
  } else if (Math.abs(scaled - 0.75) < 0.01) {
    formatted = '3/4';
  } else {
    formatted = scaled.toFixed(2).replace(/\.?0+$/, '');
  }
  
  return amount.replace(numMatch[1], formatted);
};

// ============================================
// AI HELPER - Calls Netlify Function
// ============================================
const callRecipeAI = async (type, data) => {
  const response = await fetch('/.netlify/functions/recipe-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...data })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }
  
  return response.json();
};

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [view, setView] = useState('home');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(() => getLocalStorage('bfr-favorites', []));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get unique family authors from recipes (only those marked as family)
  const familyAuthors = ['all', ...new Set(
    recipes
      .filter(r => r.authorIsFamily !== false && r.author)
      .map(r => r.author)
  )];

  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('dateAdded', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipesData);
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle deep linking to specific recipe
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#recipe-')) {
      const recipeId = hash.replace('#recipe-', '');
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setView('view');
      }
    }
  }, [recipes]);

  // Save favorites to local storage
  useEffect(() => {
    setLocalStorage('bfr-favorites', favorites);
  }, [favorites]);

  const toggleFavorite = (recipeId) => {
    setFavorites(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  // Clear search when changing views
  const navigateTo = (newView, recipe = null) => {
    if (newView !== 'home') {
      setSearchQuery('');
      setSelectedAuthor('all');
    }
    setSelectedRecipe(recipe);
    setView(newView);
    setMobileMenuOpen(false);
    
    // Update URL hash for recipe deep links
    if (newView === 'view' && recipe) {
      window.history.pushState(null, '', `#recipe-${recipe.id}`);
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const copyShareLink = (recipeId) => {
    const url = `${window.location.origin}${window.location.pathname}#recipe-${recipeId}`;
    navigator.clipboard.writeText(url).then(() => {
      showNotification('Link copied to clipboard!');
    }).catch(() => {
      showNotification('Could not copy link', 'error');
    });
  };

  // Normalize ingredients before saving
  const normalizeRecipeData = (recipe) => {
    const normalized = { ...recipe };
    
    // Normalize ingredient units (but preserve the original structure)
    if (Array.isArray(normalized.ingredients)) {
      normalized.ingredients = normalized.ingredients.map(ing => {
        if (typeof ing === 'string') {
          // Parse string ingredient into structured format
          const parsed = parseIngredientString(ing);
          return { amount: `${parsed.quantity} ${parsed.unit}`.trim(), ingredient: parsed.item };
        } else if (ing.amount !== undefined && ing.ingredient !== undefined) {
          // Already structured - normalize the amount field
          let newAmount = ing.amount || '';
          
          // Fix broken fractions like "1 /2" -> "1/2" or "1/2 c." -> "1/2 cup"
          newAmount = newAmount.replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
          
          // Normalize unit abbreviations
          Object.entries(UNIT_MAPPINGS).forEach(([from, to]) => {
            // Match whole words only, case insensitive
            const regex = new RegExp(`\\b${from}\\b\\.?`, 'gi');
            newAmount = newAmount.replace(regex, to);
          });
          
          // Also fix common patterns like "c." -> "cup", "t." -> "tsp"
          newAmount = newAmount.replace(/\bc\.(?!\w)/gi, 'cup');
          newAmount = newAmount.replace(/\bt\.(?!\w)/gi, 'tsp');
          
          // Clean up extra spaces
          newAmount = newAmount.replace(/\s+/g, ' ').trim();
          
          return { amount: newAmount, ingredient: ing.ingredient };
        }
        return ing;
      });
    }
    
    // Infer cook time if missing
    if (!normalized.cookTime && Array.isArray(normalized.instructions)) {
      const inferredTime = extractCookTimeFromInstructions(normalized.instructions);
      if (inferredTime) {
        normalized.cookTime = inferredTime;
      }
    }
    
    return normalized;
  };

  const saveRecipe = async (recipe) => {
    try {
      const { id, ...recipeData } = normalizeRecipeData(recipe);
      
      if (id) {
        await updateDoc(doc(db, 'recipes', id), recipeData);
        showNotification('Recipe updated');
      } else {
        const newRecipe = { ...recipeData, dateAdded: new Date().toISOString() };
        await addDoc(collection(db, 'recipes'), newRecipe);
        showNotification('Recipe saved');
      }
      navigateTo('home');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Error saving recipe: ' + error.message, 'error');
    }
  };

  // Normalize all existing recipes (one-time migration)
  const normalizeAllRecipes = async () => {
    if (!confirm('This will normalize all existing recipe data (units, ingredients). Continue?')) return;
    
    setIsProcessing(true);
    let updated = 0;
    
    try {
      for (const recipe of recipes) {
        const normalized = normalizeRecipeData(recipe);
        const { id, ...data } = normalized;
        
        // Check if anything changed
        const changed = JSON.stringify(recipe) !== JSON.stringify(normalized);
        if (changed && id) {
          await updateDoc(doc(db, 'recipes', id), data);
          updated++;
        }
      }
      showNotification(`Normalized ${updated} recipes`);
    } catch (error) {
      console.error('Normalize error:', error);
      showNotification('Error normalizing recipes', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const addComment = async (recipeId, comment) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;
      
      const newComment = {
        id: Date.now().toString(),
        text: comment.text,
        author: comment.author,
        date: new Date().toISOString()
      };
      
      const updatedComments = [...(recipe.comments || []), newComment];
      await updateDoc(doc(db, 'recipes', recipeId), { comments: updatedComments });
      showNotification('Comment added');
    } catch (error) {
      console.error('Comment error:', error);
      showNotification('Error adding comment', 'error');
    }
  };

  const deleteComment = async (recipeId, commentId) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;
      
      const updatedComments = (recipe.comments || []).filter(c => c.id !== commentId);
      await updateDoc(doc(db, 'recipes', recipeId), { comments: updatedComments });
      showNotification('Comment removed');
    } catch (error) {
      console.error('Delete comment error:', error);
      showNotification('Error removing comment', 'error');
    }
  };

  const addMadeIt = async (recipeId, name) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;
      
      const madeItEntry = {
        id: Date.now().toString(),
        name: name || 'Someone',
        date: new Date().toISOString()
      };
      
      const updatedMadeIt = [...(recipe.madeIt || []), madeItEntry];
      await updateDoc(doc(db, 'recipes', recipeId), { madeIt: updatedMadeIt });
      showNotification(`${name || 'You'} made it! 🎉`);
    } catch (error) {
      console.error('Made it error:', error);
      showNotification('Error recording', 'error');
    }
  };

  const deleteRecipe = async (recipeId, imageUrl, handwrittenImageUrl) => {
    try {
      // Delete main image
      if (imageUrl && imageUrl.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.log('Image deletion skipped');
        }
      }
      
      // Delete handwritten image
      if (handwrittenImageUrl && handwrittenImageUrl.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, handwrittenImageUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.log('Handwritten image deletion skipped');
        }
      }
      
      await deleteDoc(doc(db, 'recipes', recipeId));
      showNotification('Recipe removed');
      navigateTo('home');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Error deleting recipe', 'error');
    }
  };

  const uploadImage = async (file, folder = 'recipes') => {
    if (!file) return null;
    
    try {
      // Process image to consistent aspect ratio
      const processedFile = await processImageForUpload(file);
      
      const fileName = `${folder}/${Date.now()}_${file.name.replace(/\.[^.]+$/, '.jpg')}`;
      const imageRef = ref(storage, fileName);
      
      await uploadBytes(imageRef, processedFile);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const exportRecipes = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bever-family-recipes.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Recipes exported!');
  };

  // Filter and sort recipes
  const filteredRecipes = recipes
    .filter(recipe => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        recipe.title?.toLowerCase().includes(query) ||
        recipe.ingredients?.some(i => i.ingredient?.toLowerCase().includes(query)) ||
        recipe.author?.toLowerCase().includes(query) ||
        recipe.notes?.toLowerCase().includes(query) ||
        recipe.story?.toLowerCase().includes(query) ||
        recipe.comments?.some(c => 
          c.text?.toLowerCase().includes(query) || 
          c.author?.toLowerCase().includes(query)
        );
      const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
      const matchesAuthor = selectedAuthor === 'all' || recipe.author === selectedAuthor;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(recipe.id);
      return matchesSearch && matchesCategory && matchesAuthor && matchesFavorites;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.dateAdded) - new Date(b.dateAdded);
        case 'newest':
          return new Date(b.dateAdded) - new Date(a.dateAdded);
        case 'a-z':
          return (a.title || '').localeCompare(b.title || '');
        case 'z-a':
          return (b.title || '').localeCompare(a.title || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '') || 
                 (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingLogo}>BF</div>
          <p style={styles.loadingText}>Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {notification && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#5c6d5e' : '#9b6b5b'
        }}>
          {notification.message}
        </div>
      )}

      <header style={styles.header} className="no-print">
        <div style={styles.headerInner}>
          <div 
            style={styles.logo} 
            onClick={() => { navigateTo('home'); setSelectedCategory('all'); }}
          >
            <span style={styles.logoMark}>BF</span>
            <div style={styles.logoText}>
              <span style={styles.logoTitle}>Bever Family</span>
              <span style={styles.logoSubtitle}>R E C I P E S</span>
            </div>
          </div>
          
          {/* Desktop nav */}
          <nav style={styles.nav} className="desktop-nav">
            <button 
              style={view === 'home' ? styles.navLinkActive : styles.navLink}
              onClick={() => navigateTo('home')}
            >
              Recipes
            </button>
            <button 
              style={view === 'add' ? styles.navLinkActive : styles.navLink}
              onClick={() => navigateTo('add')}
            >
              Add New
            </button>
            <button 
              style={styles.navLink}
              onClick={exportRecipes}
              title="Export all recipes as JSON"
            >
              Export
            </button>
          </nav>
          
          {/* Mobile menu button */}
          <button 
            style={styles.mobileMenuBtn}
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav style={styles.mobileNav} className="mobile-nav">
            <button 
              style={styles.mobileNavLink}
              onClick={() => navigateTo('home')}
            >
              All Recipes
            </button>
            <button 
              style={styles.mobileNavLink}
              onClick={() => navigateTo('add')}
            >
              Add New Recipe
            </button>
            <button 
              style={styles.mobileNavLink}
              onClick={() => { exportRecipes(); setMobileMenuOpen(false); }}
            >
              Export Recipes
            </button>
          </nav>
        )}
      </header>

      <main style={styles.main}>
        {view === 'home' && (
          <HomePage
            recipes={recipes}
            filteredRecipes={filteredRecipes}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            familyAuthors={familyAuthors}
            selectedAuthor={selectedAuthor}
            setSelectedAuthor={setSelectedAuthor}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            setSelectedRecipe={(r) => navigateTo('view', r)}
            setView={navigateTo}
            onNormalizeAll={normalizeAllRecipes}
            isProcessing={isProcessing}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
          />
        )}

        {(view === 'add' || view === 'edit') && (
          <AddRecipePage
            recipe={selectedRecipe}
            categories={categories.filter(c => c.id !== 'all')}
            onSave={saveRecipe}
            onCancel={() => navigateTo(selectedRecipe ? 'view' : 'home', selectedRecipe)}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            showNotification={showNotification}
            uploadImage={uploadImage}
          />
        )}

        {view === 'view' && selectedRecipe && (
          <RecipeDetailPage
            recipe={recipes.find(r => r.id === selectedRecipe.id) || selectedRecipe}
            categories={categories}
            onEdit={() => navigateTo('edit', selectedRecipe)}
            onDelete={() => {
              if (confirm('Remove this recipe from the collection?')) {
                deleteRecipe(selectedRecipe.id, selectedRecipe.imageUrl, selectedRecipe.handwrittenImageUrl);
              }
            }}
            onBack={() => navigateTo('home')}
            onAddComment={(comment) => addComment(selectedRecipe.id, comment)}
            onDeleteComment={(commentId) => deleteComment(selectedRecipe.id, commentId)}
            onShare={() => copyShareLink(selectedRecipe.id)}
            onMadeIt={(name) => addMadeIt(selectedRecipe.id, name)}
            isFavorite={favorites.includes(selectedRecipe.id)}
            onToggleFavorite={() => toggleFavorite(selectedRecipe.id)}
          />
        )}
      </main>

      <footer style={styles.footer} className="no-print">
        <div style={styles.footerContent}>
          <span style={styles.footerLogo}>BF</span>
          <p style={styles.footerText}>Bever Family Recipes</p>
          <p style={styles.footerTagline}>Gathering around the table, one recipe at a time</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// HOME PAGE
// ============================================
function HomePage({ recipes, filteredRecipes, categories, selectedCategory, setSelectedCategory, familyAuthors, selectedAuthor, setSelectedAuthor, searchQuery, setSearchQuery, sortBy, setSortBy, setSelectedRecipe, setView, onNormalizeAll, isProcessing, favorites, toggleFavorite, showFavoritesOnly, setShowFavoritesOnly }) {
  const [showAdminTools, setShowAdminTools] = useState(false);

  return (
    <div>
      <section style={styles.hero} className="no-print">
        <div style={styles.heroContent}>
          <p style={styles.heroWelcome}>Welcome to the</p>
          <h1 style={styles.heroTitle}>Bever Family Recipes</h1>
          <div style={styles.heroDivider}>
            <span style={styles.heroDividerLine}></span>
            <span style={styles.heroDividerIcon}>✦</span>
            <span style={styles.heroDividerLine}></span>
          </div>
          <p style={styles.heroSubtitle}>
            A collection of treasured recipes passed down through generations.<br />
            From our kitchen to yours.
          </p>
          
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search recipes, ingredients, stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button 
                style={styles.clearSearch}
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div style={styles.filterRow}>
            {familyAuthors.length > 2 && (
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>From:</label>
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">All Family</option>
                  {familyAuthors.filter(a => a !== 'all').map(author => (
                    <option key={author} value={author}>{author}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.filterSelect}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            
            <button
              style={{
                ...styles.favoritesToggle,
                backgroundColor: showFavoritesOnly ? '#5c6d5e' : 'transparent',
                color: showFavoritesOnly ? 'white' : '#5a5a5a',
              }}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              ♥ Favorites {showFavoritesOnly && `(${favorites.length})`}
            </button>
          </div>
        </div>
      </section>

      <section style={styles.categorySection} className="no-print">
        <div style={styles.categoryPills}>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={selectedCategory === cat.id ? styles.categoryPillActive : styles.categoryPill}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section style={styles.recipeSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            {showFavoritesOnly ? 'Favorites' : 
              selectedCategory === 'all' ? 'All Recipes' : 
              categories.find(c => c.id === selectedCategory)?.name}
            {selectedAuthor !== 'all' && ` from ${selectedAuthor}`}
          </h2>
          <span style={styles.recipeCount}>{filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}</span>
        </div>
        
        {filteredRecipes.length > 0 ? (
          <div style={styles.recipeGrid}>
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                categories={categories}
                onClick={() => setSelectedRecipe(recipe)}
                isFavorite={favorites.includes(recipe.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✦</div>
            <h3 style={styles.emptyTitle}>No recipes found</h3>
            <p style={styles.emptyText}>
              {searchQuery || selectedAuthor !== 'all' || showFavoritesOnly
                ? 'Try adjusting your search or filters.'
                : 'Start your family\'s collection by adding the first recipe.'}
            </p>
            {!searchQuery && selectedAuthor === 'all' && !showFavoritesOnly && (
              <button style={styles.emptyButton} onClick={() => setView('add')}>
                Add a Recipe
              </button>
            )}
          </div>
        )}

        {/* Admin tools toggle */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button 
            onClick={() => setShowAdminTools(!showAdminTools)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c9c4bc',
              fontSize: 11,
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            {showAdminTools ? '✕ Hide Tools' : '⚙ Admin Tools'}
          </button>
          
          {showAdminTools && (
            <div style={{ marginTop: 16, padding: 20, background: '#f5f3ef', borderRadius: 4 }}>
              <button 
                onClick={onNormalizeAll} 
                disabled={isProcessing} 
                style={{
                  padding: '12px 24px',
                  background: '#5c6d5e',
                  color: 'white',
                  border: 'none',
                  borderRadius: 2,
                  fontSize: 12,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                {isProcessing ? 'Processing...' : 'Normalize All Recipes'}
              </button>
              <p style={{ fontSize: 12, color: '#5a5a5a', margin: 0 }}>
                Standardizes units (tbsp, tsp, lb) & infers missing cook times
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ============================================
// RECIPE CARD
// ============================================
function RecipeCard({ recipe, categories, onClick, isFavorite, onToggleFavorite }) {
  const category = categories.find(c => c.id === recipe.category);
  const [imageError, setImageError] = useState(false);
  const commentCount = recipe.comments?.length || 0;
  const madeItCount = recipe.madeIt?.length || 0;

  return (
    <div style={styles.recipeCard} onClick={onClick}>
      <div style={styles.cardImageContainer}>
        {recipe.imageUrl && !imageError ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title}
            style={styles.cardImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={styles.cardImagePlaceholder}>
            <span style={styles.placeholderIcon}>✦</span>
          </div>
        )}
        <button 
          style={{
            ...styles.favoriteBtn,
            color: isFavorite ? '#c75050' : 'white',
          }}
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
      <div style={styles.cardContent}>
        {category && (
          <span style={styles.cardCategory}>{category.name}</span>
        )}
        <h3 style={styles.cardTitle}>{recipe.title}</h3>
        {recipe.author && (
          <p style={styles.cardAuthor}>{formatAuthorDisplay(recipe.author, recipe.authorIsFamily)}</p>
        )}
        <div style={styles.cardMeta}>
          {recipe.prepTime && <span>{recipe.prepTime}</span>}
          {recipe.prepTime && recipe.servings && <span style={styles.cardMetaDot}>·</span>}
          {recipe.servings && <span>Serves {recipe.servings}</span>}
          {madeItCount > 0 && (
            <>
              <span style={styles.cardMetaDot}>·</span>
              <span>✓ {madeItCount} made</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD RECIPE PAGE
// ============================================
function AddRecipePage({ recipe, categories, onSave, onCancel, isProcessing, setIsProcessing, showNotification, uploadImage }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState(recipe || EMPTY_RECIPE);
  const [uploadedScanImage, setUploadedScanImage] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(recipe?.imageUrl || null);
  const [handwrittenImagePreview, setHandwrittenImagePreview] = useState(recipe?.handwrittenImageUrl || null);
  const [imageFile, setImageFile] = useState(null);
  const [handwrittenImageFile, setHandwrittenImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteContent, setWebsiteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const recipeImageInputRef = useRef(null);
  const handwrittenImageInputRef = useRef(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { amount: '', ingredient: '' }]
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInstruction = (index, value) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      setFormData(prev => ({
        ...prev,
        instructions: prev.instructions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleRecipePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }
    setRecipeImagePreview(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleHandwrittenPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }
    setHandwrittenImagePreview(URL.createObjectURL(file));
    setHandwrittenImageFile(file);
  };

  const removeRecipePhoto = () => {
    setRecipeImagePreview(null);
    setImageFile(null);
    updateField('imageUrl', '');
  };

  const removeHandwrittenPhoto = () => {
    setHandwrittenImagePreview(null);
    setHandwrittenImageFile(null);
    updateField('handwrittenImageUrl', '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file) => {
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      showNotification('Please select an image or PDF file', 'error');
      return;
    }

    setIsProcessing(true);
    
    if (isImage) {
      setUploadedScanImage(URL.createObjectURL(file));
      setUploadedFileName(null);
    } else {
      setUploadedScanImage(null);
      setUploadedFileName(file.name);
    }

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const data = await callRecipeAI(isPDF ? 'scan-pdf' : 'scan-image', { 
        imageData: base64, 
        imageType: file.type 
      });
      
      const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({ ...prev, ...extracted }));
        showNotification('Recipe extracted! Review the details below.');
        setActiveTab('manual');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Could not read recipe. Try entering it manually.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleWebsiteImport = async () => {
    const content = websiteContent.trim();
    if (!content) {
      showNotification('Please paste the recipe content from the website', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const data = await callRecipeAI('extract-website', { content });
      
      const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({ ...prev, ...extracted, authorIsFamily: false }));
        showNotification('Recipe imported! Review the details below.');
        setActiveTab('manual');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Could not extract recipe. Try copying just the recipe text.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlFetch = async () => {
    const url = websiteUrl.trim();
    if (!url) {
      showNotification('Please enter a recipe URL', 'error');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showNotification('Please enter a valid URL starting with http:// or https://', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const data = await callRecipeAI('fetch-url', { url });
      
      if (data.error) {
        showNotification(data.error, 'error');
        return;
      }
      
      const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({ ...prev, ...extracted, authorIsFamily: false }));
        showNotification('Recipe imported! Review the details below.');
        setActiveTab('manual');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Could not fetch recipe. Some sites block this - try pasting the content instead.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Please enter a recipe title', 'error');
      return;
    }

    setUploadingImage(true);
    
    try {
      let imageUrl = formData.imageUrl || '';
      let handwrittenImageUrl = formData.handwrittenImageUrl || '';
      
      if (imageFile) {
        showNotification('Uploading photo...');
        imageUrl = await uploadImage(imageFile, 'recipes');
      }
      
      if (handwrittenImageFile) {
        showNotification('Uploading handwritten recipe...');
        handwrittenImageUrl = await uploadImage(handwrittenImageFile, 'handwritten');
      }
      
      const cleanedData = {
        ...formData,
        imageUrl,
        handwrittenImageUrl,
        ingredients: Array.isArray(formData.ingredients) 
          ? formData.ingredients.filter(i => i.amount || i.ingredient)
          : [],
        instructions: Array.isArray(formData.instructions)
          ? formData.instructions.filter(i => i && i.trim())
          : [],
        comments: formData.comments || [],
        madeIt: formData.madeIt || [],
      };
      
      await onSave(cleanedData);
    } catch (error) {
      console.error('Submit error:', error);
      showNotification('Error saving recipe: ' + error.message, 'error');
      setUploadingImage(false);
    }
  };

  return (
    <div style={styles.addPage}>
      <div style={styles.addPageHeader}>
        <h1 style={styles.addPageTitle}>{recipe ? 'Edit Recipe' : 'Add New Recipe'}</h1>
        <p style={styles.addPageSubtitle}>Share a treasured family recipe</p>
      </div>

      {!recipe && (
        <div style={styles.tabs}>
          <button
            style={activeTab === 'manual' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('manual')}
          >
            Write it out
          </button>
          <button
            style={activeTab === 'scan' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('scan')}
          >
            Scan file
          </button>
          <button
            style={activeTab === 'website' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('website')}
          >
            From website
          </button>
        </div>
      )}

      {activeTab === 'scan' && !recipe && (
        <div style={styles.scanSection}>
          <div 
            style={{
              ...styles.uploadZone,
              borderColor: isDragging ? '#8a9a8e' : '#d9d6d0',
              backgroundColor: isDragging ? '#f0f5f1' : '#faf9f7'
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedScanImage ? (
              <img src={uploadedScanImage} alt="Uploaded" style={styles.uploadedImage} />
            ) : uploadedFileName ? (
              <div style={styles.pdfPreview}>
                <div style={styles.pdfIcon}>PDF</div>
                <p style={styles.pdfFileName}>{uploadedFileName}</p>
              </div>
            ) : (
              <>
                <div style={styles.scanIcon}>✦</div>
                <h3 style={styles.scanTitle}>Scan a Recipe</h3>
                <p style={styles.scanText}>
                  Drag & drop a photo or PDF here, or click to browse.<br />
                  We'll convert it to text for you.
                </p>
                <button type="button" style={styles.uploadButton}>
                  Choose File
                </button>
                <p style={styles.fileTypes}>Supports: JPG, PNG, PDF</p>
              </>
            )}
            {isProcessing && (
              <div style={styles.processingOverlay}>
                <div style={styles.spinner} />
                <p>Reading recipe...</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handleScanFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {activeTab === 'website' && !recipe && (
        <div style={styles.websiteSection}>
          <div style={styles.websiteBox}>
            <div style={styles.scanIcon}>✦</div>
            <h3 style={styles.scanTitle}>Import from Website</h3>
            <p style={styles.scanText}>
              Found a recipe online? Enter the URL and we'll grab it for you,<br />
              or paste the recipe content directly.
            </p>
            
            <div style={styles.websiteInputGroup}>
              <label style={styles.label}>Option 1: Fetch from URL</label>
              <div style={styles.urlFetchRow}>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.allrecipes.com/recipe/..."
                  style={styles.urlInput}
                />
                <button 
                  type="button" 
                  onClick={handleUrlFetch}
                  style={styles.fetchButton}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
              <p style={styles.websiteHint}>
                Works with most recipe sites. Some sites may block this.
              </p>
            </div>

            <div style={styles.orDivider}>
              <span style={styles.orLine}></span>
              <span style={styles.orText}>or</span>
              <span style={styles.orLine}></span>
            </div>

            <div style={styles.websiteInputGroup}>
              <label style={styles.label}>Option 2: Paste Recipe Content</label>
              <p style={styles.websiteHint}>
                Copy the recipe from the website and paste it here
              </p>
              <textarea
                value={websiteContent}
                onChange={(e) => setWebsiteContent(e.target.value)}
                placeholder="Paste the recipe content here..."
                style={styles.websiteTextarea}
                rows={10}
              />
              <button 
                type="button" 
                onClick={handleWebsiteImport}
                style={styles.uploadButton}
                disabled={isProcessing || !websiteContent.trim()}
              >
                {isProcessing ? 'Extracting...' : 'Extract Recipe'}
              </button>
            </div>

            {isProcessing && (
              <div style={styles.processingOverlay}>
                <div style={styles.spinner} />
                <p>Reading recipe...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'manual' || recipe) && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Basic Information</h3>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Recipe Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Grandma's Apple Pie"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select one...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formRow3}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prep Time</label>
                <input
                  type="text"
                  value={formData.prepTime}
                  onChange={(e) => updateField('prepTime', e.target.value)}
                  placeholder="20 min"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cook Time</label>
                <input
                  type="text"
                  value={formData.cookTime}
                  onChange={(e) => updateField('cookTime', e.target.value)}
                  placeholder="1 hour"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Servings</label>
                <input
                  type="text"
                  value={formData.servings}
                  onChange={(e) => updateField('servings', e.target.value)}
                  placeholder="6-8"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Recipe from</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  placeholder="Grandma Bever, Mom, etc."
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Source Type</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="authorIsFamily"
                      checked={formData.authorIsFamily !== false}
                      onChange={() => updateField('authorIsFamily', true)}
                      style={styles.radio}
                    />
                    <span>Family / Friend</span>
                    <span style={styles.radioHint}>(shows in filter)</span>
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="authorIsFamily"
                      checked={formData.authorIsFamily === false}
                      onChange={() => updateField('authorIsFamily', false)}
                      style={styles.radio}
                    />
                    <span>Website / Cookbook</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Photos</h3>
            
            <div style={styles.photoGrid}>
              <div style={styles.photoUploadArea}>
                <label style={styles.photoLabel}>Finished Dish</label>
                {recipeImagePreview ? (
                  <div style={styles.photoPreviewContainer}>
                    <img src={recipeImagePreview} alt="Recipe" style={styles.photoPreview} />
                    <div style={styles.photoActions}>
                      <button type="button" onClick={() => recipeImageInputRef.current?.click()} style={styles.photoChangeBtn}>
                        Change
                      </button>
                      <button type="button" onClick={removeRecipePhoto} style={styles.photoRemoveBtn}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.photoDropzone} onClick={() => recipeImageInputRef.current?.click()}>
                    <span style={styles.photoIcon}>📷</span>
                    <p style={styles.photoText}>Add photo of the dish</p>
                  </div>
                )}
                <input
                  ref={recipeImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRecipePhotoSelect}
                  style={{ display: 'none' }}
                />
              </div>
              
              <div style={styles.photoUploadArea}>
                <label style={styles.photoLabel}>Original Recipe Card</label>
                {handwrittenImagePreview ? (
                  <div style={styles.photoPreviewContainer}>
                    <img src={handwrittenImagePreview} alt="Handwritten" style={styles.photoPreview} />
                    <div style={styles.photoActions}>
                      <button type="button" onClick={() => handwrittenImageInputRef.current?.click()} style={styles.photoChangeBtn}>
                        Change
                      </button>
                      <button type="button" onClick={removeHandwrittenPhoto} style={styles.photoRemoveBtn}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.photoDropzone} onClick={() => handwrittenImageInputRef.current?.click()}>
                    <span style={styles.photoIcon}>✍️</span>
                    <p style={styles.photoText}>Add handwritten recipe</p>
                  </div>
                )}
                <input
                  ref={handwrittenImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHandwrittenPhotoSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>The Story</h3>
            <p style={styles.fieldHint}>Share the history or special memories behind this recipe</p>
            <textarea
              value={formData.story}
              onChange={(e) => updateField('story', e.target.value)}
              placeholder="This recipe has been in our family since... Grandma used to make this every Christmas... The secret ingredient is..."
              style={styles.storyInput}
              rows={4}
            />
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Ingredients</h3>
            {formData.ingredients.map((ing, index) => (
              <div key={index} style={styles.ingredientRow}>
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  placeholder="1 cup"
                  style={styles.amountInput}
                />
                <input
                  type="text"
                  value={ing.ingredient}
                  onChange={(e) => updateIngredient(index, 'ingredient', e.target.value)}
                  placeholder="all-purpose flour"
                  style={styles.ingredientInput}
                />
                <button type="button" onClick={() => removeIngredient(index)} style={styles.removeBtn}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addIngredient} style={styles.addItemBtn}>
              + Add ingredient
            </button>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Instructions</h3>
            {formData.instructions.map((inst, index) => (
              <div key={index} style={styles.instructionRow}>
                <span style={styles.stepNum}>{index + 1}</span>
                <textarea
                  value={inst}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder="Describe this step..."
                  style={styles.instructionInput}
                  rows={2}
                />
                <button type="button" onClick={() => removeInstruction(index)} style={styles.removeBtn}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addInstruction} style={styles.addItemBtn}>
              + Add step
            </button>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Tips & Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any tips, variations, or substitutions..."
              style={styles.notesInput}
              rows={3}
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onCancel} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.saveBtn} disabled={uploadingImage}>
              {uploadingImage ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ============================================
// RECIPE DETAIL PAGE
// ============================================
function RecipeDetailPage({ recipe, categories, onEdit, onDelete, onBack, onAddComment, onDeleteComment, onShare, onMadeIt, isFavorite, onToggleFavorite }) {
  const category = categories.find(c => c.id === recipe.category);
  const [imageError, setImageError] = useState(false);
  const [handwrittenImageError, setHandwrittenImageError] = useState(false);
  const [newComment, setNewComment] = useState({ author: '', text: '' });
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showMadeItForm, setShowMadeItForm] = useState(false);
  const [madeItName, setMadeItName] = useState('');
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [showHandwrittenModal, setShowHandwrittenModal] = useState(false);

  const handleAddComment = () => {
    if (!newComment.text.trim()) return;
    if (!newComment.author.trim()) {
      newComment.author = 'Anonymous';
    }
    onAddComment(newComment);
    setNewComment({ author: '', text: '' });
    setShowCommentForm(false);
  };

  const handleMadeIt = () => {
    onMadeIt(madeItName.trim() || 'Someone');
    setMadeItName('');
    setShowMadeItForm(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div style={styles.detailPage}>
      <div style={styles.detailNav} className="no-print">
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={styles.detailActions}>
          <button onClick={onToggleFavorite} style={{...styles.actionBtn, color: isFavorite ? '#c75050' : '#5a5a5a'}}>
            {isFavorite ? '♥' : '♡'}
          </button>
          <button onClick={onShare} style={styles.actionBtn}>Share</button>
          <button onClick={() => window.print()} style={styles.actionBtn}>Print</button>
          <button onClick={onEdit} style={styles.actionBtn}>Edit</button>
          <button onClick={onDelete} style={styles.deleteBtn}>Delete</button>
        </div>
      </div>

      <article style={styles.recipeDetail} className="print-recipe">
        {recipe.imageUrl && !imageError && (
          <div style={styles.detailImageWrap} className="print-image">
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title}
              style={styles.detailImage}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        <div style={styles.detailContent}>
          <header style={styles.detailHeader}>
            {category && <span style={styles.detailCategory}>{category.name}</span>}
            <h1 style={styles.detailTitle}>{recipe.title}</h1>
            {recipe.author && (
              <p style={styles.detailAuthor}>{formatAuthorDisplay(recipe.author, recipe.authorIsFamily)}</p>
            )}
            
            <div style={styles.detailMeta}>
              {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
              {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
              {recipe.servings && <span>Serves {recipe.servings}</span>}
            </div>
            
            {/* Made It section */}
            <div style={styles.madeItSection} className="no-print">
              {recipe.madeIt && recipe.madeIt.length > 0 && (
                <p style={styles.madeItList}>
                  ✓ Made by: {recipe.madeIt.map(m => m.name).join(', ')}
                </p>
              )}
              {!showMadeItForm ? (
                <button onClick={() => setShowMadeItForm(true)} style={styles.madeItBtn}>
                  ✓ I Made This!
                </button>
              ) : (
                <div style={styles.madeItForm}>
                  <input
                    type="text"
                    value={madeItName}
                    onChange={(e) => setMadeItName(e.target.value)}
                    placeholder="Your name"
                    style={styles.madeItInput}
                    autoFocus
                  />
                  <button onClick={handleMadeIt} style={styles.madeItSubmit}>Add</button>
                  <button onClick={() => setShowMadeItForm(false)} style={styles.madeItCancel}>✕</button>
                </div>
              )}
            </div>
          </header>

          {/* Story section */}
          {recipe.story && (
            <section style={styles.storyBox}>
              <h3 style={styles.storyTitle}>The Story</h3>
              <p style={styles.storyContent}>{recipe.story}</p>
            </section>
          )}

          <div style={styles.detailDivider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerIcon}>✦</span>
            <span style={styles.dividerLine}></span>
          </div>

          {/* Servings Scaler */}
          <div style={styles.scalerRow} className="no-print">
            <span style={styles.scalerLabel}>Adjust servings:</span>
            <div style={styles.scalerButtons}>
              <button 
                style={{...styles.scalerBtn, ...(servingsMultiplier === 0.5 ? styles.scalerBtnActive : {})}}
                onClick={() => setServingsMultiplier(0.5)}
              >½×</button>
              <button 
                style={{...styles.scalerBtn, ...(servingsMultiplier === 1 ? styles.scalerBtnActive : {})}}
                onClick={() => setServingsMultiplier(1)}
              >1×</button>
              <button 
                style={{...styles.scalerBtn, ...(servingsMultiplier === 2 ? styles.scalerBtnActive : {})}}
                onClick={() => setServingsMultiplier(2)}
              >2×</button>
              <button 
                style={{...styles.scalerBtn, ...(servingsMultiplier === 3 ? styles.scalerBtnActive : {})}}
                onClick={() => setServingsMultiplier(3)}
              >3×</button>
            </div>
          </div>

          <div style={styles.detailBody}>
            <section style={styles.ingredientsCol}>
              <h2 style={styles.colTitle}>Ingredients</h2>
              <ul style={styles.ingredientsList}>
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} style={styles.ingredientItem}>
                    <strong>{scaleIngredientAmount(ing.amount, servingsMultiplier)}</strong> {ing.ingredient}
                  </li>
                ))}
              </ul>
            </section>

            <section style={styles.instructionsCol}>
              <h2 style={styles.colTitle}>Instructions</h2>
              <ol style={styles.instructionsList}>
                {recipe.instructions?.map((inst, i) => (
                  <li key={i} style={styles.instructionItem}>{inst}</li>
                ))}
              </ol>
            </section>
          </div>

          {recipe.notes && (
            <section style={styles.notesBox}>
              <h3 style={styles.notesTitle}>Tips & Notes</h3>
              <p style={styles.notesContent}>{recipe.notes}</p>
            </section>
          )}

          {/* Handwritten Recipe Card */}
          {recipe.handwrittenImageUrl && !handwrittenImageError && (
            <section style={styles.handwrittenSection} className="no-print">
              <h3 style={styles.handwrittenTitle}>Original Recipe Card</h3>
              <img 
                src={recipe.handwrittenImageUrl}
                alt="Original handwritten recipe"
                style={styles.handwrittenThumb}
                onClick={() => setShowHandwrittenModal(true)}
                onError={() => setHandwrittenImageError(true)}
              />
              <p style={styles.handwrittenHint}>Click to enlarge</p>
            </section>
          )}

          {/* Handwritten Modal */}
          {showHandwrittenModal && (
            <div style={styles.modal} onClick={() => setShowHandwrittenModal(false)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button style={styles.modalClose} onClick={() => setShowHandwrittenModal(false)}>✕</button>
                <img 
                  src={recipe.handwrittenImageUrl}
                  alt="Original handwritten recipe"
                  style={styles.modalImage}
                />
              </div>
            </div>
          )}

          <section style={styles.commentsSection} className="no-print">
            <div style={styles.commentsSectionHeader}>
              <h3 style={styles.commentsTitle}>
                Family Notes & Reviews ({recipe.comments?.length || 0})
              </h3>
              {!showCommentForm && (
                <button 
                  onClick={() => setShowCommentForm(true)} 
                  style={styles.addCommentBtn}
                >
                  + Add Note
                </button>
              )}
            </div>

            {showCommentForm && (
              <div style={styles.commentForm}>
                <input
                  type="text"
                  value={newComment.author}
                  onChange={(e) => setNewComment(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Your name"
                  style={styles.commentAuthorInput}
                />
                <textarea
                  value={newComment.text}
                  onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Share your experience with this recipe, any changes you made, or tips for others..."
                  style={styles.commentTextInput}
                  rows={3}
                />
                <div style={styles.commentFormActions}>
                  <button 
                    type="button" 
                    onClick={() => setShowCommentForm(false)} 
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAddComment}
                    style={styles.saveBtn}
                    disabled={!newComment.text.trim()}
                  >
                    Add Note
                  </button>
                </div>
              </div>
            )}

            {recipe.comments && recipe.comments.length > 0 ? (
              <div style={styles.commentsList}>
                {recipe.comments.map((comment) => (
                  <div key={comment.id} style={styles.commentItem}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentAuthor}>{comment.author}</span>
                      <span style={styles.commentDate}>{formatDate(comment.date)}</span>
                    </div>
                    <p style={styles.commentText}>{comment.text}</p>
                    <button 
                      onClick={() => {
                        if (confirm('Remove this note?')) {
                          onDeleteComment(comment.id);
                        }
                      }}
                      style={styles.deleteCommentBtn}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : !showCommentForm && (
              <p style={styles.noComments}>
                No notes yet. Be the first to share your experience with this recipe!
              </p>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}

// ============================================
// STYLES - Updated with darker text colors
// ============================================
const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#fdfcfa',
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#2d2d2d', // Darker base text
  },
  
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ef',
  },
  loadingContent: { textAlign: 'center' },
  loadingLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 48,
    color: '#8a9a8e',
    letterSpacing: 4,
    marginBottom: 16,
  },
  loadingText: { color: '#5a5a5a', fontSize: 14, letterSpacing: 2 },

  notification: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '14px 28px',
    borderRadius: 2,
    color: 'white',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 0.5,
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },

  header: {
    backgroundColor: '#fdfcfa',
    borderBottom: '1px solid #e8e6e2',
    padding: '20px 40px',
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    cursor: 'pointer',
  },
  logoMark: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    color: '#8a9a8e',
    letterSpacing: 3,
  },
  logoText: { display: 'flex', flexDirection: 'column' },
  logoTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20,
    fontWeight: 600,
    color: '#2d2d2d',
    lineHeight: 1.1,
  },
  logoSubtitle: { fontSize: 10, letterSpacing: 3, color: '#8a9a8e' },
  nav: { display: 'flex', gap: 24 },
  navLink: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#5a5a5a',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: '8px 0',
    borderBottom: '2px solid transparent',
  },
  navLinkActive: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#2d2d2d',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: '8px 0',
    borderBottom: '2px solid #8a9a8e',
  },
  mobileMenuBtn: {
    display: 'none',
    background: 'none',
    border: '1px solid #d9d6d0',
    borderRadius: 4,
    padding: '8px 12px',
    fontSize: 18,
    cursor: 'pointer',
    color: '#5a5a5a',
  },
  mobileNav: {
    display: 'none',
    flexDirection: 'column',
    gap: 0,
    padding: '16px 0',
    borderTop: '1px solid #e8e6e2',
    marginTop: 16,
  },
  mobileNavLink: {
    background: 'none',
    border: 'none',
    padding: '12px 16px',
    fontSize: 14,
    color: '#2d2d2d',
    cursor: 'pointer',
    textAlign: 'left',
    borderBottom: '1px solid #f0ede8',
  },

  hero: {
    backgroundColor: '#f5f3ef',
    padding: '60px 40px',
    textAlign: 'center',
  },
  heroContent: { maxWidth: 700, margin: '0 auto' },
  heroWelcome: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 48,
    fontWeight: 400,
    color: '#2d2d2d',
    marginBottom: 24,
    lineHeight: 1.1,
  },
  heroDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  heroDividerLine: { width: 60, height: 1, backgroundColor: '#c9c4bc' },
  heroDividerIcon: { color: '#8a9a8e', fontSize: 12 },
  heroSubtitle: { fontSize: 15, color: '#5a5a5a', lineHeight: 1.8, marginBottom: 32 },
  searchContainer: { 
    maxWidth: 400, 
    margin: '0 auto',
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '16px 48px 16px 24px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    backgroundColor: 'white',
    outline: 'none',
    textAlign: 'center',
    letterSpacing: 0.5,
    color: '#2d2d2d',
  },
  clearSearch: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#7a7a7a',
    cursor: 'pointer',
    padding: 4,
  },
  filterRow: {
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: '#5a5a5a',
  },
  filterSelect: {
    padding: '10px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    backgroundColor: 'white',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 130,
    color: '#2d2d2d',
  },
  favoritesToggle: {
    padding: '10px 16px',
    fontSize: 13,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    cursor: 'pointer',
    fontWeight: 500,
  },

  categorySection: {
    padding: '24px 40px',
    borderBottom: '1px solid #e8e6e2',
    backgroundColor: '#fdfcfa',
    overflowX: 'auto',
  },
  categoryPills: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    maxWidth: 1000,
    margin: '0 auto',
  },
  categoryPill: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 11,
    fontWeight: 500,
    color: '#5a5a5a',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  categoryPillActive: {
    padding: '8px 16px',
    background: '#5c6d5e',
    border: '1px solid #5c6d5e',
    borderRadius: 2,
    fontSize: 11,
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  recipeSection: { padding: '48px 40px', maxWidth: 1200, margin: '0 auto' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: '1px solid #e8e6e2',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    fontWeight: 400,
    color: '#2d2d2d',
  },
  recipeCount: { fontSize: 13, color: '#7a7a7a', letterSpacing: 0.5 },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 32,
  },

  recipeCard: {
    background: 'white',
    border: '1px solid #e8e6e2',
    borderRadius: 2,
    overflow: 'hidden',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'box-shadow 0.2s',
  },
  cardImageContainer: { 
    height: 200, 
    overflow: 'hidden', 
    backgroundColor: '#f5f3ef',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ef',
  },
  placeholderIcon: { fontSize: 32, color: '#c9c4bc' },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { padding: 20 },
  cardCategory: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 6,
    display: 'block',
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20,
    fontWeight: 400,
    color: '#2d2d2d',
    marginBottom: 6,
    lineHeight: 1.3,
  },
  cardAuthor: { fontSize: 12, color: '#6a6a6a', fontStyle: 'italic', marginBottom: 10 },
  cardMeta: { fontSize: 11, color: '#6a6a6a', display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
  cardMetaDot: { margin: '0 6px' },

  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: 32, color: '#c9c4bc', marginBottom: 24 },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    color: '#2d2d2d',
    marginBottom: 12,
  },
  emptyText: { color: '#5a5a5a', marginBottom: 32, fontSize: 15 },
  emptyButton: {
    padding: '14px 32px',
    background: '#5c6d5e',
    color: 'white',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },

  footer: {
    backgroundColor: '#f5f3ef',
    padding: '48px 40px',
    textAlign: 'center',
    borderTop: '1px solid #e8e6e2',
  },
  footerContent: { maxWidth: 400, margin: '0 auto' },
  footerLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32,
    color: '#8a9a8e',
    letterSpacing: 4,
    marginBottom: 16,
    display: 'block',
  },
  footerText: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20,
    color: '#2d2d2d',
    marginBottom: 8,
  },
  footerTagline: { fontSize: 13, color: '#6a6a6a', fontStyle: 'italic' },

  addPage: { maxWidth: 700, margin: '0 auto', padding: '48px 24px' },
  addPageHeader: { textAlign: 'center', marginBottom: 40 },
  addPageTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36,
    color: '#2d2d2d',
    marginBottom: 8,
  },
  addPageSubtitle: { color: '#6a6a6a', fontSize: 14 },
  tabs: {
    display: 'flex',
    marginBottom: 32,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: '14px 16px',
    background: 'white',
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    color: '#5a5a5a',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  tabActive: {
    flex: 1,
    padding: '14px 16px',
    background: '#5c6d5e',
    border: 'none',
    fontSize: 12,
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },

  scanSection: { marginBottom: 32 },
  uploadZone: {
    border: '2px dashed #d9d6d0',
    borderRadius: 2,
    padding: '60px 40px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#faf9f7',
    position: 'relative',
    transition: 'all 0.2s',
  },
  scanIcon: { fontSize: 32, color: '#8a9a8e', marginBottom: 16 },
  scanTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24,
    color: '#2d2d2d',
    marginBottom: 12,
  },
  scanText: { color: '#5a5a5a', fontSize: 14, marginBottom: 24, lineHeight: 1.7 },
  uploadButton: {
    padding: '14px 28px',
    background: '#5c6d5e',
    color: 'white',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  uploadedImage: { maxWidth: '100%', maxHeight: 300, borderRadius: 2 },
  pdfPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  pdfIcon: {
    width: 80,
    height: 100,
    background: '#e8e6e2',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
    color: '#5a5a5a',
    letterSpacing: 1,
  },
  pdfFileName: {
    fontSize: 14,
    color: '#4a4a4a',
    fontWeight: 500,
  },
  fileTypes: {
    fontSize: 12,
    color: '#7a7a7a',
    marginTop: 16,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(253,252,250,0.95)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e8e6e2',
    borderTopColor: '#8a9a8e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 16,
  },

  websiteSection: { marginBottom: 32 },
  websiteBox: {
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    padding: 40,
    backgroundColor: '#faf9f7',
    position: 'relative',
    textAlign: 'center',
  },
  websiteInputGroup: { marginTop: 24, textAlign: 'left' },
  websiteHint: { fontSize: 12, color: '#6a6a6a', marginBottom: 8, fontStyle: 'italic' },
  websiteTextarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: 'white',
    marginBottom: 16,
    color: '#2d2d2d',
  },
  urlFetchRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    padding: '14px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    color: '#2d2d2d',
  },
  fetchButton: {
    padding: '14px 24px',
    background: '#5c6d5e',
    color: 'white',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    margin: '32px 0',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d9d6d0',
  },
  orText: {
    fontSize: 12,
    color: '#7a7a7a',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  form: { background: 'white', border: '1px solid #e8e6e2', padding: 40 },
  formSection: { marginBottom: 40 },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #e8e6e2',
  },
  fieldHint: {
    fontSize: 13,
    color: '#6a6a6a',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  formRow3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 },
  formGroup: { marginBottom: 20 },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#4a4a4a',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    color: '#2d2d2d',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#2d2d2d',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#3d3d3d',
    cursor: 'pointer',
  },
  radio: {
    accentColor: '#5c6d5e',
  },
  radioHint: {
    fontSize: 11,
    color: '#8a8a8a',
    marginLeft: 4,
  },

  photoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  photoUploadArea: {},
  photoLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#4a4a4a',
    marginBottom: 10,
  },
  photoPreviewContainer: { position: 'relative' },
  photoPreview: { width: '100%', height: 180, objectFit: 'cover', borderRadius: 2 },
  photoActions: { position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8 },
  photoChangeBtn: {
    padding: '8px 16px',
    background: 'white',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  photoRemoveBtn: {
    padding: '8px 16px',
    background: 'white',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    color: '#9b6b5b',
  },
  photoDropzone: {
    border: '2px dashed #d9d6d0',
    borderRadius: 2,
    padding: '30px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    height: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: { fontSize: 28, display: 'block', marginBottom: 8 },
  photoText: { fontSize: 12, color: '#6a6a6a' },

  storyInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    lineHeight: 1.7,
    color: '#2d2d2d',
  },

  ingredientRow: { display: 'flex', gap: 12, marginBottom: 12 },
  amountInput: {
    width: 100,
    padding: '12px 14px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    color: '#2d2d2d',
  },
  ingredientInput: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    color: '#2d2d2d',
  },
  removeBtn: {
    width: 40,
    height: 40,
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    cursor: 'pointer',
    fontSize: 18,
    color: '#7a7a7a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtn: {
    padding: '12px 20px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 13,
    color: '#5a5a5a',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  instructionRow: { display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 32,
    height: 32,
    background: '#f5f3ef',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 500,
    color: '#5a5a5a',
    flexShrink: 0,
    marginTop: 4,
  },
  instructionInput: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    color: '#2d2d2d',
  },
  notesInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    color: '#2d2d2d',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 24,
    borderTop: '1px solid #e8e6e2',
    marginTop: 20,
  },
  cancelBtn: {
    padding: '14px 28px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
    color: '#5a5a5a',
  },
  saveBtn: {
    padding: '14px 32px',
    background: '#5c6d5e',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
    color: 'white',
  },

  detailPage: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  detailNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 12,
  },
  backBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 13,
    color: '#5a5a5a',
    cursor: 'pointer',
  },
  detailActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    padding: '10px 16px',
    background: 'white',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 12,
    color: '#5a5a5a',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: '10px 16px',
    background: 'white',
    border: '1px solid #c9a89a',
    borderRadius: 2,
    fontSize: 12,
    color: '#9b6b5b',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  recipeDetail: { background: 'white', border: '1px solid #e8e6e2', overflow: 'hidden' },
  detailImageWrap: { height: 400, overflow: 'hidden' },
  detailImage: { width: '100%', height: '100%', objectFit: 'cover' },
  detailContent: { padding: 48 },
  detailHeader: { textAlign: 'center', marginBottom: 32 },
  detailCategory: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 12,
    display: 'block',
  },
  detailTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 42,
    fontWeight: 400,
    color: '#2d2d2d',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  detailAuthor: { fontSize: 15, color: '#6a6a6a', fontStyle: 'italic', marginBottom: 24 },
  detailMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    fontSize: 13,
    color: '#5a5a5a',
    flexWrap: 'wrap',
  },
  
  madeItSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid #f0ede8',
  },
  madeItList: {
    fontSize: 13,
    color: '#5c6d5e',
    marginBottom: 12,
    fontWeight: 500,
  },
  madeItBtn: {
    padding: '10px 20px',
    background: '#f5f3ef',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 13,
    color: '#5c6d5e',
    cursor: 'pointer',
    fontWeight: 500,
  },
  madeItForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  madeItInput: {
    padding: '10px 14px',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 14,
    width: 150,
    outline: 'none',
  },
  madeItSubmit: {
    padding: '10px 16px',
    background: '#5c6d5e',
    color: 'white',
    border: 'none',
    borderRadius: 2,
    fontSize: 12,
    cursor: 'pointer',
  },
  madeItCancel: {
    padding: '10px 12px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 14,
    cursor: 'pointer',
    color: '#7a7a7a',
  },

  storyBox: {
    padding: 28,
    background: '#faf9f7',
    borderLeft: '3px solid #c9b896',
    marginBottom: 24,
  },
  storyTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#a89968',
    marginBottom: 12,
  },
  storyContent: { fontSize: 15, color: '#4a4a4a', lineHeight: 1.8, fontStyle: 'italic' },

  detailDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    margin: '32px 0',
  },
  dividerLine: { width: 60, height: 1, backgroundColor: '#e8e6e2' },
  dividerIcon: { color: '#c9c4bc', fontSize: 12 },
  
  scalerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  scalerLabel: {
    fontSize: 13,
    color: '#5a5a5a',
  },
  scalerButtons: {
    display: 'flex',
    gap: 6,
  },
  scalerBtn: {
    padding: '8px 14px',
    background: 'white',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 13,
    color: '#5a5a5a',
    cursor: 'pointer',
  },
  scalerBtnActive: {
    background: '#5c6d5e',
    borderColor: '#5c6d5e',
    color: 'white',
  },

  detailBody: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48 },
  ingredientsCol: {},
  instructionsCol: {},
  colTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #e8e6e2',
  },
  ingredientsList: { listStyle: 'none' },
  ingredientItem: {
    padding: '10px 0',
    borderBottom: '1px dotted #e8e6e2',
    fontSize: 14,
    color: '#3d3d3d',
  },
  instructionsList: { paddingLeft: 20 },
  instructionItem: { padding: '12px 0', fontSize: 14, color: '#3d3d3d', lineHeight: 1.8 },
  notesBox: {
    marginTop: 40,
    padding: 28,
    background: '#f9f8f6',
    borderLeft: '3px solid #8a9a8e',
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 12,
  },
  notesContent: { fontSize: 14, color: '#4a4a4a', lineHeight: 1.8, fontStyle: 'italic' },

  handwrittenSection: {
    marginTop: 40,
    textAlign: 'center',
  },
  handwrittenTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#a89968',
    marginBottom: 16,
  },
  handwrittenThumb: {
    maxWidth: 300,
    maxHeight: 200,
    objectFit: 'cover',
    borderRadius: 4,
    border: '1px solid #e8e6e2',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  handwrittenHint: {
    fontSize: 11,
    color: '#8a8a8a',
    marginTop: 8,
  },

  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalContent: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
  },
  modalClose: {
    position: 'absolute',
    top: -40,
    right: 0,
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: 24,
    cursor: 'pointer',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: 4,
  },

  commentsSection: {
    marginTop: 48,
    paddingTop: 32,
    borderTop: '1px solid #e8e6e2',
  },
  commentsSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  commentsTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
  },
  addCommentBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #8a9a8e',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    color: '#5c6d5e',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  commentForm: {
    background: '#f9f8f6',
    padding: 24,
    marginBottom: 24,
    borderRadius: 2,
  },
  commentAuthorInput: {
    width: '100%',
    maxWidth: 300,
    padding: '12px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: 12,
    color: '#2d2d2d',
  },
  commentTextInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: 16,
    color: '#2d2d2d',
  },
  commentFormActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  commentsList: {},
  commentItem: {
    padding: '20px 0',
    borderBottom: '1px solid #e8e6e2',
    position: 'relative',
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: 600,
    fontSize: 14,
    color: '#2d2d2d',
  },
  commentDate: {
    fontSize: 12,
    color: '#7a7a7a',
  },
  commentText: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 1.7,
  },
  deleteCommentBtn: {
    position: 'absolute',
    top: 20,
    right: 0,
    background: 'none',
    border: 'none',
    fontSize: 12,
    color: '#c9a89a',
    cursor: 'pointer',
  },
  noComments: {
    fontSize: 14,
    color: '#7a7a7a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '24px 0',
  },
};

// ============================================
// GLOBAL STYLES (Print, Mobile, Animations)
// ============================================
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Animations */
    @keyframes spin { to { transform: rotate(360deg); } }
    
    /* Mobile menu visibility */
    @media (min-width: 769px) {
      .mobile-menu-btn { display: none !important; }
      .mobile-nav { display: none !important; }
      .desktop-nav { display: flex !important; }
    }
    
    @media (max-width: 768px) {
      .mobile-menu-btn { display: block !important; }
      .mobile-nav { display: flex !important; }
      .desktop-nav { display: none !important; }
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      header > div {
        padding: 16px 20px !important;
      }
      
      section[style*="hero"] {
        padding: 40px 20px !important;
      }
      
      section[style*="hero"] h1 {
        font-size: 32px !important;
      }
      
      section[style*="categorySection"] {
        padding: 16px 12px !important;
      }
      
      section[style*="categorySection"] > div {
        justify-content: flex-start !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
      }
      
      section[style*="recipeSection"] {
        padding: 24px 16px !important;
      }
      
      /* Single column on mobile */
      div[style*="recipeGrid"] {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
      }
      
      div[style*="formRow"], div[style*="formRow3"] {
        grid-template-columns: 1fr !important;
      }
      
      div[style*="photoGrid"] {
        grid-template-columns: 1fr !important;
      }
      
      div[style*="detailBody"] {
        grid-template-columns: 1fr !important;
        gap: 32px !important;
      }
      
      div[style*="detailContent"] {
        padding: 24px 16px !important;
      }
      
      h1[style*="detailTitle"] {
        font-size: 28px !important;
      }
      
      div[style*="detailImageWrap"] {
        height: 250px !important;
      }
      
      form[style*="form"] {
        padding: 24px 16px !important;
      }
      
      div[style*="addPage"] {
        padding: 24px 16px !important;
      }
      
      footer {
        padding: 32px 20px !important;
      }
      
      div[style*="ingredientRow"] {
        flex-wrap: wrap;
      }
      
      input[style*="amountInput"] {
        width: 80px !important;
        flex-shrink: 0;
      }
      
      div[style*="filterRow"] {
        flex-direction: column;
        gap: 12px !important;
      }
      
      div[style*="detailActions"] {
        width: 100%;
        justify-content: center;
      }
    }
    
    /* Print Styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .no-print {
        display: none !important;
      }
      
      .print-recipe {
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
      }
      
      .print-image {
        height: 200px !important;
        page-break-inside: avoid;
      }
      
      div[style*="detailPage"] {
        padding: 0 !important;
        max-width: 100% !important;
      }
      
      div[style*="detailContent"] {
        padding: 20px !important;
      }
      
      div[style*="detailBody"] {
        display: block !important;
      }
      
      section[style*="ingredientsCol"] {
        margin-bottom: 24px;
        page-break-inside: avoid;
      }
      
      section[style*="instructionsCol"] {
        page-break-inside: avoid;
      }
      
      h1[style*="detailTitle"] {
        font-size: 24px !important;
        margin-bottom: 8px !important;
      }
      
      div[style*="detailMeta"] {
        margin-bottom: 16px;
      }
      
      section[style*="notesBox"], section[style*="storyBox"] {
        margin-top: 24px !important;
        padding: 16px !important;
        page-break-inside: avoid;
      }
      
      li[style*="ingredientItem"] {
        padding: 4px 0 !important;
        font-size: 12px !important;
      }
      
      li[style*="instructionItem"] {
        padding: 6px 0 !important;
        font-size: 12px !important;
        line-height: 1.5 !important;
      }
      
      h2[style*="colTitle"] {
        font-size: 10px !important;
        margin-bottom: 12px !important;
        padding-bottom: 8px !important;
      }
      
      /* Hide divider on print */
      div[style*="detailDivider"] {
        margin: 16px 0 !important;
      }
      
      /* Ensure single page fit */
      @page {
        margin: 0.5in;
        size: letter;
      }
    }
  `;
  document.head.appendChild(style);
}
