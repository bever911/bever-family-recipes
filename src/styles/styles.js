// ============================================
// DEVOL-INSPIRED STYLES
// Warm, classic, timeless kitchen aesthetic
// ============================================

// Color palette
const colors = {
  // Backgrounds
  cream: '#f7f5f0',
  warmWhite: '#fffefa',
  linen: '#f3f0e8',
  
  // Primary accent - Aged Brass
  brass: '#b8956b',
  brassLight: '#c9a86c',
  brassDark: '#a07d50',
  
  // Secondary - Sage Green
  sage: '#5c6d5e',
  sageDark: '#4a5a4c',
  sageLight: '#8a9a8e',
  
  // Text
  textDark: '#3d3d3d',
  textMedium: '#5a5a5a',
  textLight: '#7a7a7a',
  textMuted: '#9a9a8a',
  
  // Borders
  borderLight: '#e5e0d5',
  borderMedium: '#d5d0c5',
  borderDark: '#c9c4b5',
  
  // Accents
  favorite: '#c75050',
  error: '#9b6b5b',
};

export const styles = {
  // ============================================
  // LAYOUT
  // ============================================
  app: {
    minHeight: '100vh',
    background: colors.cream,
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    color: colors.textDark,
    lineHeight: 1.6,
  },

  // ============================================
  // HEADER
  // ============================================
  header: {
    background: colors.cream,
    borderBottom: `1px solid ${colors.borderLight}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  logoMark: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    fontWeight: 500,
    color: colors.sage,
    width: 52,
    height: 52,
    border: `2px solid ${colors.sage}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: 2,
  },
  logoTextWrap: { display: 'flex', flexDirection: 'column' },
  logoTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22,
    fontWeight: 500,
    color: colors.textDark,
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 10,
    letterSpacing: 4,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: 400,
  },
  nav: { display: 'flex', gap: 8, alignItems: 'center' },
  navLink: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMedium,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    transition: 'color 0.2s',
  },
  navLinkActive: {
    color: colors.sage,
    borderBottom: `1px solid ${colors.sage}`,
  },
  familyBtn: {
    padding: '10px 24px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    transition: 'background 0.2s',
  },
  mobileMenuBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: colors.textMedium,
    padding: 8,
  },

  // ============================================
  // HERO SECTION
  // ============================================
  hero: {
    background: `linear-gradient(to bottom, ${colors.cream}, ${colors.linen})`,
    padding: '80px 40px',
    textAlign: 'center',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  heroWelcome: {
    fontSize: 13,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 16,
    fontWeight: 400,
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 56,
    fontWeight: 400,
    color: colors.textDark,
    marginBottom: 24,
    letterSpacing: 2,
    lineHeight: 1.1,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    margin: '28px 0',
  },
  dividerLine: {
    width: 60,
    height: 1,
    background: colors.borderDark,
  },
  dividerIcon: {
    color: colors.brass,
    fontSize: 14,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textLight,
    lineHeight: 1.9,
    maxWidth: 500,
    margin: '0 auto 40px',
    fontWeight: 300,
  },
  searchContainer: {
    maxWidth: 480,
    margin: '0 auto',
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '16px 24px',
    fontSize: 16, // Prevents iOS zoom
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    letterSpacing: 0.5,
    boxSizing: 'border-box',
  },

  // ============================================
  // CATEGORY SECTION
  // ============================================
  categorySection: {
    background: colors.cream,
    padding: '24px 40px',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  categoryPills: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: 900,
    margin: '0 auto',
  },
  categoryPill: {
    padding: '12px 20px', // Increased for mobile
    background: 'transparent',
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textLight,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    transition: 'all 0.2s',
  },
  categoryPillActive: {
    background: colors.sage,
    borderColor: colors.sage,
    color: 'white',
  },

  // ============================================
  // RECIPE GRID
  // ============================================
  recipeSection: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '60px 40px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 40,
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    fontWeight: 400,
    color: colors.textDark,
    letterSpacing: 1,
  },
  recipeCount: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 32,
  },

  // ============================================
  // RECIPE CARDS
  // ============================================
  recipeCard: {
    background: colors.warmWhite,
    border: `1px solid ${colors.borderLight}`,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 220,
    overflow: 'hidden',
    position: 'relative',
    background: colors.linen,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${colors.linen} 0%, #ebe8e0 100%)`,
  },
  placeholderIcon: {
    fontSize: 32,
    color: colors.borderDark,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40, // Increased for mobile
    height: 40,
    background: 'rgba(255, 255, 250, 0.9)',
    border: 'none',
    borderRadius: '50%',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.brass,
    transition: 'transform 0.2s',
  },
  cardContent: { padding: 24 },
  cardCategory: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.brass,
    marginBottom: 8,
    display: 'block',
    fontWeight: 500,
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22,
    fontWeight: 500,
    color: colors.textDark,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  cardAuthor: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },

  // ============================================
  // RECIPE DETAIL PAGE
  // ============================================
  detailPage: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 40,
  },
  detailNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  backBtn: {
    padding: '12px 24px',
    background: colors.warmWhite,
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMedium,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  detailActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '12px 20px', // Increased for mobile
    background: colors.warmWhite,
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 12,
    color: colors.textMedium,
    cursor: 'pointer',
    letterSpacing: 0.5,
    fontFamily: "'Montserrat', sans-serif",
  },
  printBtn: {
    padding: '12px 28px',
    background: `linear-gradient(135deg, ${colors.brassLight} 0%, ${colors.brass} 50%, ${colors.brassDark} 100%)`,
    border: 'none',
    color: 'white',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    boxShadow: '0 2px 8px rgba(184, 149, 107, 0.3)',
  },
  deleteBtn: {
    padding: '12px 20px',
    background: colors.warmWhite,
    border: `1px solid ${colors.error}`,
    color: colors.error,
    fontSize: 12,
    cursor: 'pointer',
    letterSpacing: 0.5,
    fontFamily: "'Montserrat', sans-serif",
  },
  recipeDetail: {
    background: colors.warmWhite,
    border: `1px solid ${colors.borderLight}`,
    overflow: 'hidden',
  },
  detailImageWrap: {
    height: 400,
    overflow: 'hidden',
    position: 'relative',
    background: colors.linen,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: colors.linen,
  },
  imageCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 24px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
    color: 'white',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailContent: { padding: 48 },
  detailHeader: { textAlign: 'center', marginBottom: 40 },
  detailCategory: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.brass,
    marginBottom: 12,
    display: 'block',
    fontWeight: 500,
  },
  detailTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 42,
    fontWeight: 400,
    color: colors.textDark,
    marginBottom: 12,
    lineHeight: 1.2,
    letterSpacing: 1,
  },
  detailAuthor: {
    fontSize: 15,
    color: colors.textLight,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  detailMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    fontSize: 13,
    color: colors.textMedium,
    flexWrap: 'wrap',
  },
  sectionSeparator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    margin: '40px 0',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    background: colors.borderLight,
    maxWidth: 100,
  },
  separatorIcon: {
    color: colors.brass,
    fontSize: 12,
  },
  detailBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: 48,
  },
  colTitle: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: `1px solid ${colors.borderLight}`,
    fontWeight: 600,
  },
  ingredientsList: { listStyle: 'none', padding: 0, margin: 0 },
  ingredientItem: {
    padding: '10px 0',
    borderBottom: `1px solid ${colors.linen}`,
    fontSize: 14,
    color: colors.textMedium,
  },
  instructionsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    counterReset: 'step',
  },
  instructionItem: {
    padding: '16px 0',
    borderBottom: `1px solid ${colors.linen}`,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 1.7,
    display: 'flex',
    gap: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    background: colors.linen,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: colors.sage,
    flexShrink: 0,
  },

  // Story & Notes boxes
  storyBox: {
    marginTop: 40,
    padding: 32,
    background: `linear-gradient(135deg, #faf8f3 0%, ${colors.linen} 100%)`,
    borderLeft: `3px solid ${colors.brass}`,
  },
  storyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 18,
    fontWeight: 500,
    color: colors.sage,
    marginBottom: 12,
    letterSpacing: 1,
  },
  storyContent: {
    fontSize: 15,
    color: colors.textMedium,
    lineHeight: 1.8,
    fontStyle: 'italic',
  },
  notesBox: {
    marginTop: 24,
    padding: 24,
    background: colors.linen,
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 12,
    fontWeight: 600,
  },
  notesContent: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 1.7,
  },

  // Handwritten section
  handwrittenSection: {
    marginTop: 40,
    padding: 32,
    background: colors.linen,
    textAlign: 'center',
  },
  handwrittenTitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.brass,
    marginBottom: 16,
    fontWeight: 500,
  },
  handwrittenThumb: {
    maxWidth: 300,
    maxHeight: 200,
    objectFit: 'cover',
    borderRadius: 4,
    border: `1px solid ${colors.borderLight}`,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  handwrittenCaption: {
    fontSize: 13,
    color: colors.textMedium,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  handwrittenHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },

  // ============================================
  // ADD/EDIT RECIPE FORM
  // ============================================
  addPage: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '40px 20px',
  },
  addPageHeader: {
    textAlign: 'center',
    marginBottom: 40,
  },
  addPageTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36,
    fontWeight: 400,
    color: colors.textDark,
    marginBottom: 8,
  },
  addPageSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  tab: {
    padding: '14px 28px',
    background: colors.warmWhite,
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMedium,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  tabActive: {
    padding: '14px 28px',
    background: colors.sage,
    border: `1px solid ${colors.sage}`,
    fontSize: 12,
    letterSpacing: 1,
    color: 'white',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  form: {
    background: colors.warmWhite,
    border: `1px solid ${colors.borderLight}`,
    padding: 40,
  },
  formSection: {
    marginBottom: 32,
  },
  formSectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: `1px solid ${colors.borderLight}`,
    fontWeight: 600,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: colors.textMedium,
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16, // Prevents iOS zoom
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16, // Prevents iOS zoom
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    minHeight: 120,
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16, // Prevents iOS zoom
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
    outline: 'none',
    cursor: 'pointer',
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },

  // Ingredient row with drag handle
  ingredientRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dragHandle: {
    cursor: 'grab',
    padding: 8,
    color: colors.textMuted,
    fontSize: 16,
    userSelect: 'none',
  },
  qtyInput: {
    width: 70,
    padding: '12px 10px',
    fontSize: 16,
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  unitInput: {
    width: 90,
    padding: '12px 10px',
    fontSize: 16,
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
  },
  ingredientInput: {
    flex: 1,
    padding: '12px 10px',
    fontSize: 16,
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
  },
  removeBtn: {
    width: 36,
    height: 36,
    background: 'none',
    border: `1px solid ${colors.borderMedium}`,
    color: colors.textMuted,
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addRowBtn: {
    padding: '12px 20px',
    background: 'none',
    border: `1px dashed ${colors.borderMedium}`,
    color: colors.textMuted,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Montserrat', sans-serif",
    width: '100%',
    marginTop: 8,
  },

  // Instruction row
  instructionRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    background: colors.linen,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: colors.sage,
    flexShrink: 0,
    marginTop: 8,
  },
  instructionTextarea: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 16,
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 60,
  },

  // Image upload
  imageUploadArea: {
    border: `2px dashed ${colors.borderMedium}`,
    borderRadius: 4,
    padding: 32,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    background: colors.linen,
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: 200,
    objectFit: 'contain',
    borderRadius: 4,
    marginBottom: 12,
  },
  uploadIcon: {
    fontSize: 32,
    color: colors.textMuted,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Form buttons
  formActions: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    marginTop: 40,
    paddingTop: 32,
    borderTop: `1px solid ${colors.borderLight}`,
  },
  saveBtn: {
    padding: '16px 48px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  cancelBtn: {
    padding: '16px 32px',
    background: colors.warmWhite,
    border: `1px solid ${colors.borderMedium}`,
    color: colors.textMedium,
    fontSize: 13,
    letterSpacing: 1,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },

  // ============================================
  // TRASH PAGE
  // ============================================
  trashPage: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '40px 20px',
  },
  trashHeader: {
    textAlign: 'center',
    marginBottom: 40,
  },
  trashTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36,
    fontWeight: 400,
    color: colors.textDark,
    marginBottom: 8,
  },
  trashSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  trashWarning: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 24,
    padding: 16,
    background: '#fdf8f6',
    border: `1px solid ${colors.error}`,
    textAlign: 'center',
  },
  trashItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    background: colors.warmWhite,
    border: `1px solid ${colors.borderLight}`,
    marginBottom: 12,
  },
  trashItemTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20,
    color: colors.textDark,
  },
  trashItemMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  trashItemActions: {
    display: 'flex',
    gap: 8,
  },
  restoreBtn: {
    padding: '10px 16px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  emptyTrashBtn: {
    padding: '14px 28px',
    background: colors.error,
    border: 'none',
    color: 'white',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notification: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '16px 32px',
    background: colors.textDark,
    color: 'white',
    fontSize: 14,
    borderRadius: 4,
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  notificationError: {
    background: colors.error,
  },

  // ============================================
  // LOADING
  // ============================================
  loadingScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContent: { textAlign: 'center' },
  loadingLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 48,
    color: colors.sage,
    width: 100,
    height: 100,
    border: `3px solid ${colors.sage}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    letterSpacing: 4,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  spinner: {
    width: 24,
    height: 24,
    border: `2px solid ${colors.borderLight}`,
    borderTopColor: colors.sage,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // ============================================
  // MODAL
  // ============================================
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
    fontSize: 32,
    cursor: 'pointer',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '85vh',
    objectFit: 'contain',
  },

  // ============================================
  // FAMILY LOGIN
  // ============================================
  loginModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loginBox: {
    background: colors.warmWhite,
    padding: 40,
    maxWidth: 400,
    width: '90%',
    textAlign: 'center',
  },
  loginTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    color: colors.textDark,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
  },
  loginInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: `1px solid ${colors.borderMedium}`,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: "'Montserrat', sans-serif",
    boxSizing: 'border-box',
  },
  loginBtn: {
    width: '100%',
    padding: '14px 24px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 13,
    letterSpacing: 1,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
    marginBottom: 12,
  },
  loginCancel: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    fontSize: 13,
    cursor: 'pointer',
  },

  // ============================================
  // FILTER ROW
  // ============================================
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  filterSelect: {
    padding: '10px 16px',
    fontSize: 13,
    border: `1px solid ${colors.borderMedium}`,
    background: colors.warmWhite,
    fontFamily: "'Montserrat', sans-serif",
    cursor: 'pointer',
  },
  favoritesToggle: {
    padding: '10px 16px',
    background: 'none',
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 13,
    color: colors.textMedium,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  favoritesToggleActive: {
    background: colors.favorite,
    borderColor: colors.favorite,
    color: 'white',
  },

  // ============================================
  // ADMIN TOOLS
  // ============================================
  adminToolBtn: {
    padding: '10px 20px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },

  // ============================================
  // FOOTER
  // ============================================
  footer: {
    background: colors.textDark,
    padding: '48px 40px',
    textAlign: 'center',
    marginTop: 80,
  },
  footerLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24,
    color: colors.brass,
    letterSpacing: 3,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#a0a0a0',
    letterSpacing: 2,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 12,
    color: '#707070',
    fontStyle: 'italic',
  },

  // Made It Section
  madeItSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: `1px solid ${colors.borderLight}`,
  },
  madeItList: {
    fontSize: 13,
    color: colors.sage,
    marginBottom: 12,
    fontWeight: 500,
  },
  madeItBtn: {
    padding: '12px 20px',
    background: colors.linen,
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 13,
    color: colors.sage,
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: "'Montserrat', sans-serif",
  },
  madeItForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  madeItInput: {
    padding: '10px 14px',
    fontSize: 14,
    border: `1px solid ${colors.borderMedium}`,
    width: 150,
    fontFamily: "'Montserrat', sans-serif",
  },
  madeItSubmit: {
    padding: '10px 16px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  madeItCancel: {
    padding: '10px 12px',
    background: 'none',
    border: `1px solid ${colors.borderMedium}`,
    color: colors.textMuted,
    fontSize: 14,
    cursor: 'pointer',
  },

  // Servings scaler
  scalerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    margin: '24px 0',
    padding: '16px 0',
    borderTop: `1px solid ${colors.borderLight}`,
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  scalerLabel: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scalerButtons: {
    display: 'flex',
    gap: 4,
  },
  scalerBtn: {
    padding: '8px 14px',
    background: colors.warmWhite,
    border: `1px solid ${colors.borderMedium}`,
    fontSize: 13,
    color: colors.textMedium,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },
  scalerBtnActive: {
    background: colors.sage,
    borderColor: colors.sage,
    color: 'white',
  },

  // Comments section
  commentsSection: {
    marginTop: 40,
    padding: 24,
    background: colors.linen,
  },
  commentsTitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.sage,
    marginBottom: 16,
    fontWeight: 600,
  },
  commentItem: {
    padding: '16px 0',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textDark,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 1.6,
  },
  commentForm: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  commentTextarea: {
    padding: '12px 14px',
    fontSize: 14,
    border: `1px solid ${colors.borderMedium}`,
    fontFamily: "'Montserrat', sans-serif",
    resize: 'vertical',
    minHeight: 80,
  },
  commentSubmitRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  commentNameInput: {
    padding: '10px 14px',
    fontSize: 14,
    border: `1px solid ${colors.borderMedium}`,
    width: 150,
    fontFamily: "'Montserrat', sans-serif",
  },
  commentSubmitBtn: {
    padding: '10px 20px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Mobile nav
  mobileNav: {
    display: 'none',
    flexDirection: 'column',
    background: colors.cream,
    borderTop: `1px solid ${colors.borderLight}`,
    padding: 16,
  },
  mobileNavLink: {
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: colors.textMedium,
    cursor: 'pointer',
    textAlign: 'left',
    borderBottom: `1px solid ${colors.borderLight}`,
    fontFamily: "'Montserrat', sans-serif",
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.borderDark,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24,
    color: colors.textMedium,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // Scan/Import tabs
  scanUploadArea: {
    border: `2px dashed ${colors.borderMedium}`,
    borderRadius: 4,
    padding: 48,
    textAlign: 'center',
    cursor: 'pointer',
    background: colors.linen,
    marginBottom: 24,
  },
  websiteImportArea: {
    marginBottom: 24,
  },
  importBtn: {
    padding: '14px 32px',
    background: colors.sage,
    border: 'none',
    color: 'white',
    fontSize: 13,
    letterSpacing: 1,
    cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Unit autocomplete
  unitAutocomplete: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: colors.warmWhite,
    border: `1px solid ${colors.borderMedium}`,
    borderTop: 'none',
    zIndex: 10,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    maxHeight: 200,
    overflowY: 'auto',
  },
  unitSuggestion: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: 14,
    cursor: 'pointer',
    color: colors.textMedium,
    fontFamily: "'Montserrat', sans-serif",
  },
};

export default styles;
