import { UNIT_MAPPINGS, FRACTION_MAP, UNITS_PATTERN, MAX_FILE_SIZE } from './constants';

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
export const getLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

// ============================================
// UNIT NORMALIZATION
// ============================================
export const normalizeUnit = (unit) => {
  if (!unit) return '';
  const lower = unit.toLowerCase().trim();
  return UNIT_MAPPINGS[lower] || UNIT_MAPPINGS[unit] || unit;
};

// ============================================
// INGREDIENT PARSING
// ============================================
export const parseIngredientString = (str) => {
  if (!str || typeof str !== 'string') return { quantity: '', unit: '', item: str || '' };
  
  const original = str.trim();
  let remaining = original;
  let quantity = '';
  let unit = '';
  let item = '';
  
  // Pattern 1: Mixed number with space "2 1/2" or "2 3/4"
  const mixedSpaceMatch = remaining.match(/^(\d+)\s+([1-9]\/[1-9])\s*/);
  // Pattern 2: Mixed number with unicode "2½"
  const mixedUnicodeMatch = remaining.match(/^(\d+)([\u00BC-\u00BE\u2150-\u215E])\s*/);
  // Pattern 3: Simple fraction "1/2"
  const simpleFractionMatch = remaining.match(/^([1-9]\/[1-9])\s*/);
  // Pattern 4: Unicode fraction "½"
  const unicodeFractionMatch = remaining.match(/^([\u00BC-\u00BE\u2150-\u215E])\s*/);
  // Pattern 5: Decimal or whole number "2.5" or "2"
  const numberMatch = remaining.match(/^(\d+(?:\.\d+)?)\s*/);
  
  if (mixedSpaceMatch) {
    const whole = parseFloat(mixedSpaceMatch[1]);
    const frac = FRACTION_MAP[mixedSpaceMatch[2]] || 0;
    quantity = whole + frac;
    remaining = remaining.slice(mixedSpaceMatch[0].length).trim();
  } else if (mixedUnicodeMatch) {
    const whole = parseFloat(mixedUnicodeMatch[1]);
    const frac = FRACTION_MAP[mixedUnicodeMatch[2]] || 0;
    quantity = whole + frac;
    remaining = remaining.slice(mixedUnicodeMatch[0].length).trim();
  } else if (simpleFractionMatch) {
    quantity = FRACTION_MAP[simpleFractionMatch[1]] || simpleFractionMatch[1];
    remaining = remaining.slice(simpleFractionMatch[0].length).trim();
  } else if (unicodeFractionMatch) {
    quantity = FRACTION_MAP[unicodeFractionMatch[1]] || unicodeFractionMatch[1];
    remaining = remaining.slice(unicodeFractionMatch[0].length).trim();
  } else if (numberMatch) {
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

// ============================================
// QUANTITY FORMATTING
// ============================================
export const formatQtyDisplay = (num) => {
  if (!num && num !== 0) return '';
  
  const fractionChars = {
    0.25: '¼', 0.33: '⅓', 0.333: '⅓', 0.5: '½', 
    0.67: '⅔', 0.667: '⅔', 0.75: '¾',
    0.125: '⅛', 0.375: '⅜', 0.625: '⅝', 0.875: '⅞'
  };
  
  const whole = Math.floor(num);
  const frac = Math.round((num - whole) * 1000) / 1000;
  
  if (frac === 0) return whole.toString();
  
  // Find closest fraction
  let closestFrac = '';
  let minDiff = 1;
  for (const [val, char] of Object.entries(fractionChars)) {
    const diff = Math.abs(frac - parseFloat(val));
    if (diff < minDiff && diff < 0.05) {
      minDiff = diff;
      closestFrac = char;
    }
  }
  
  if (closestFrac) {
    return whole > 0 ? `${whole}${closestFrac}` : closestFrac;
  }
  
  // Return decimal rounded to 2 places
  return num.toFixed(2).replace(/\.?0+$/, '');
};

// ============================================
// SCALING INGREDIENTS
// ============================================
export const scaleIngredientAmount = (amount, multiplier = 1) => {
  if (!amount || multiplier === 1) return amount;
  
  const numMatch = amount.match(/^([\d.\/\s½⅓⅔¼¾⅛⅜⅝⅞]+)\s*(.*)$/);
  if (!numMatch) return amount;
  
  let numStr = numMatch[1].trim();
  const rest = numMatch[2];
  
  // Convert to decimal
  let value = 0;
  
  // Check for unicode fractions
  for (const [frac, dec] of Object.entries(FRACTION_MAP)) {
    if (numStr.includes(frac)) {
      const parts = numStr.split(frac);
      const whole = parts[0] ? parseFloat(parts[0]) || 0 : 0;
      value = whole + dec;
      break;
    }
  }
  
  if (value === 0) {
    // Try parsing as regular number or fraction
    if (numStr.includes('/')) {
      const [num, den] = numStr.split('/').map(n => parseFloat(n.trim()));
      value = num / den;
    } else {
      value = parseFloat(numStr) || 0;
    }
  }
  
  const scaled = value * multiplier;
  return `${formatQtyDisplay(scaled)} ${rest}`.trim();
};

// ============================================
// DATE FORMATTING
// ============================================
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

// ============================================
// AUTHOR FORMATTING
// ============================================
export const formatAuthorDisplay = (author, isFamily = true) => {
  if (!author) return '';
  if (isFamily) {
    return `From ${author}'s Kitchen`;
  }
  return `Source: ${author}`;
};

// ============================================
// FILE SIZE VALIDATION
// ============================================
export const validateFileSize = (file, showNotification) => {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    showNotification(`File too large (${sizeMB}MB). Maximum size is 10MB.`, 'error');
    return false;
  }
  return true;
};

// ============================================
// AI API CALL
// ============================================
export const callRecipeAI = async (type, data) => {
  const response = await fetch('/.netlify/functions/recipe-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ...data }),
  });
  
  if (!response.ok) {
    throw new Error('AI processing failed');
  }
  
  return response.json();
};
