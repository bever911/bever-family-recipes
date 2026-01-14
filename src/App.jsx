import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// ============================================
// BEVER FAMILY RECIPES
// Magnolia-inspired design
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

const EMPTY_RECIPE = {
  id: '',
  title: '',
  category: '',
  author: '',
  servings: '',
  prepTime: '',
  cookTime: '',
  ingredients: [{ amount: '', ingredient: '' }],
  instructions: [''],
  notes: '',
  imageUrl: '',
  dateAdded: '',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for recipes
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

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveRecipe = async (recipe) => {
    try {
      if (recipe.id) {
        await updateDoc(doc(db, 'recipes', recipe.id), recipe);
        showNotification('Recipe updated');
      } else {
        const newRecipe = { ...recipe, dateAdded: new Date().toISOString() };
        delete newRecipe.id;
        await addDoc(collection(db, 'recipes'), newRecipe);
        showNotification('Recipe saved');
      }
      setView('home');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Error saving recipe', 'error');
    }
  };

  const deleteRecipe = async (recipeId, imageUrl) => {
    try {
      // Delete image from storage if it's a Firebase URL
      if (imageUrl && imageUrl.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (e) {
          console.log('Image deletion skipped');
        }
      }
      
      await deleteDoc(doc(db, 'recipes', recipeId));
      showNotification('Recipe removed');
      setView('home');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Error deleting recipe', 'error');
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    try {
      const fileName = `recipes/${Date.now()}_${file.name}`;
      const imageRef = ref(storage, fileName);
      
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !searchQuery || 
      recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients?.some(i => i.ingredient?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      recipe.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div 
            style={styles.logo} 
            onClick={() => { setView('home'); setSelectedCategory('all'); setSearchQuery(''); }}
          >
            <span style={styles.logoMark}>BF</span>
            <div style={styles.logoText}>
              <span style={styles.logoTitle}>Bever Family</span>
              <span style={styles.logoSubtitle}>R E C I P E S</span>
            </div>
          </div>
          <nav style={styles.nav}>
            <button 
              style={view === 'home' ? styles.navLinkActive : styles.navLink}
              onClick={() => setView('home')}
            >
              Recipes
            </button>
            <button 
              style={view === 'add' ? styles.navLinkActive : styles.navLink}
              onClick={() => { setView('add'); setSelectedRecipe(null); }}
            >
              Add New
            </button>
            <button 
              style={view === 'book' ? styles.navLinkActive : styles.navLink}
              onClick={() => setView('book')}
            >
              Cookbook
            </button>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {view === 'home' && (
          <HomePage
            recipes={recipes}
            filteredRecipes={filteredRecipes}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedRecipe={setSelectedRecipe}
            setView={setView}
          />
        )}

        {(view === 'add' || view === 'edit') && (
          <AddRecipePage
            recipe={selectedRecipe}
            categories={categories.filter(c => c.id !== 'all')}
            onSave={saveRecipe}
            onCancel={() => setView(selectedRecipe ? 'view' : 'home')}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            showNotification={showNotification}
            uploadImage={uploadImage}
          />
        )}

        {view === 'view' && selectedRecipe && (
          <RecipeDetailPage
            recipe={selectedRecipe}
            categories={categories}
            onEdit={() => setView('edit')}
            onDelete={() => {
              if (confirm('Remove this recipe from the collection?')) {
                deleteRecipe(selectedRecipe.id, selectedRecipe.imageUrl);
              }
            }}
            onBack={() => setView('home')}
          />
        )}

        {view === 'book' && (
          <BookPage
            recipes={recipes}
            categories={categories}
            showNotification={showNotification}
          />
        )}
      </main>

      <footer style={styles.footer}>
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
function HomePage({ recipes, filteredRecipes, categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, setSelectedRecipe, setView }) {
  return (
    <div>
      {/* Hero Section */}
      <section style={styles.hero}>
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
          
          {/* Search */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section style={styles.categorySection}>
        <div style={styles.categoryPills}>
          {categories.slice(0, 8).map(cat => (
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

      {/* Recipe Grid */}
      <section style={styles.recipeSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Recipes' : categories.find(c => c.id === selectedCategory)?.name}
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
                onClick={() => { setSelectedRecipe(recipe); setView('view'); }}
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>✦</div>
            <h3 style={styles.emptyTitle}>No recipes yet</h3>
            <p style={styles.emptyText}>
              Start your family's collection by adding the first recipe.
            </p>
            <button style={styles.emptyButton} onClick={() => setView('add')}>
              Add a Recipe
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================
// RECIPE CARD
// ============================================
function RecipeCard({ recipe, categories, onClick }) {
  const category = categories.find(c => c.id === recipe.category);
  const [imageError, setImageError] = useState(false);

  return (
    <button style={styles.recipeCard} onClick={onClick}>
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
      </div>
      <div style={styles.cardContent}>
        {category && (
          <span style={styles.cardCategory}>{category.name}</span>
        )}
        <h3 style={styles.cardTitle}>{recipe.title}</h3>
        {recipe.author && (
          <p style={styles.cardAuthor}>from {recipe.author}</p>
        )}
        <div style={styles.cardMeta}>
          {recipe.prepTime && <span>{recipe.prepTime}</span>}
          {recipe.prepTime && recipe.servings && <span style={styles.cardMetaDot}>·</span>}
          {recipe.servings && <span>Serves {recipe.servings}</span>}
        </div>
      </div>
    </button>
  );
}

// ============================================
// ADD RECIPE PAGE
// ============================================
function AddRecipePage({ recipe, categories, onSave, onCancel, isProcessing, setIsProcessing, showNotification, uploadImage }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState(recipe || EMPTY_RECIPE);
  const [uploadedScanImage, setUploadedScanImage] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(recipe?.imageUrl || null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteContent, setWebsiteContent] = useState('');
  const fileInputRef = useRef(null);
  const recipeImageInputRef = useRef(null);

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

  const removeRecipePhoto = () => {
    setRecipeImagePreview(null);
    setImageFile(null);
    updateField('imageUrl', '');
  };

  const handleScanImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadedScanImage(URL.createObjectURL(file));

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call Netlify function instead of Claude directly
      const data = await callRecipeAI('scan-image', { 
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

  const handleWebsiteImport = async () => {
    const content = websiteContent.trim();
    if (!content) {
      showNotification('Please paste the recipe content from the website', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Call Netlify function instead of Claude directly
      const data = await callRecipeAI('extract-website', { content });
      
      const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({ ...prev, ...extracted }));
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

  // Fetch recipe directly from URL
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
      // Call Netlify function to fetch and extract
      const data = await callRecipeAI('fetch-url', { url });
      
      if (data.error) {
        showNotification(data.error, 'error');
        return;
      }
      
      const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({ ...prev, ...extracted }));
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
      
      if (imageFile) {
        showNotification('Uploading photo...');
        imageUrl = await uploadImage(imageFile);
      }
      
      const cleanedData = {
        ...formData,
        imageUrl,
        ingredients: Array.isArray(formData.ingredients) 
          ? formData.ingredients.filter(i => i.amount || i.ingredient)
          : [],
        instructions: Array.isArray(formData.instructions)
          ? formData.instructions.filter(i => i && i.trim())
          : []
      };
      
      await onSave(cleanedData);
    } catch (error) {
      console.error('Submit error:', error);
      showNotification('Error saving recipe', 'error');
    } finally {
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
            Scan photo
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
            style={styles.uploadZone}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedScanImage ? (
              <img src={uploadedScanImage} alt="Uploaded" style={styles.uploadedImage} />
            ) : (
              <>
                <div style={styles.scanIcon}>✦</div>
                <h3 style={styles.scanTitle}>Scan a Recipe</h3>
                <p style={styles.scanText}>
                  Upload a photo of a handwritten recipe card or cookbook page.<br />
                  We'll convert it to text for you.
                </p>
                <button type="button" style={styles.uploadButton}>
                  Choose Photo
                </button>
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
            accept="image/*"
            onChange={handleScanImageUpload}
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
            
            {/* Option 1: Fetch from URL */}
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

            {/* Option 2: Paste content */}
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

            <div style={styles.formGroup}>
              <label style={styles.label}>Recipe from</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => updateField('author', e.target.value)}
                placeholder="Grandma Bever, Mom's kitchen, etc."
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Photo</h3>
            <div style={styles.photoUploadArea}>
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
                  <span style={styles.photoIcon}>+</span>
                  <p style={styles.photoText}>Add a photo of the finished dish</p>
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
            <h3 style={styles.formSectionTitle}>Notes & Memories</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any tips, variations, or special memories about this recipe..."
              style={styles.notesInput}
              rows={4}
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
function RecipeDetailPage({ recipe, categories, onEdit, onDelete, onBack }) {
  const category = categories.find(c => c.id === recipe.category);
  const [imageError, setImageError] = useState(false);

  return (
    <div style={styles.detailPage}>
      <div style={styles.detailNav}>
        <button onClick={onBack} style={styles.backBtn}>← Back to recipes</button>
        <div style={styles.detailActions}>
          <button onClick={() => window.print()} style={styles.actionBtn}>Print</button>
          <button onClick={onEdit} style={styles.actionBtn}>Edit</button>
          <button onClick={onDelete} style={styles.deleteBtn}>Delete</button>
        </div>
      </div>

      <article style={styles.recipeDetail}>
        {recipe.imageUrl && !imageError && (
          <div style={styles.detailImageWrap}>
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
            {recipe.author && <p style={styles.detailAuthor}>A recipe from {recipe.author}</p>}
            
            <div style={styles.detailMeta}>
              {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
              {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
              {recipe.servings && <span>Serves {recipe.servings}</span>}
            </div>
          </header>

          <div style={styles.detailDivider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerIcon}>✦</span>
            <span style={styles.dividerLine}></span>
          </div>

          <div style={styles.detailBody}>
            <section style={styles.ingredientsCol}>
              <h2 style={styles.colTitle}>Ingredients</h2>
              <ul style={styles.ingredientsList}>
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} style={styles.ingredientItem}>
                    <strong>{ing.amount}</strong> {ing.ingredient}
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
              <h3 style={styles.notesTitle}>Notes</h3>
              <p style={styles.notesContent}>{recipe.notes}</p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}

// ============================================
// BOOK PAGE
// ============================================
function BookPage({ recipes, categories, showNotification }) {
  const groupedRecipes = categories
    .filter(c => c.id !== 'all')
    .map(cat => ({ ...cat, recipes: recipes.filter(r => r.category === cat.id) }))
    .filter(cat => cat.recipes.length > 0);

  const downloadHTML = () => {
    const html = generateBookHTML(recipes, categories);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bever-family-recipes.html';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Cookbook downloaded!');
  };

  return (
    <div style={styles.bookPage}>
      <div style={styles.bookHeader}>
        <div>
          <h1 style={styles.bookTitle}>Family Cookbook</h1>
          <p style={styles.bookSubtitle}>{recipes.length} recipes ready for printing</p>
        </div>
        <div style={styles.bookActions}>
          <button onClick={downloadHTML} style={styles.downloadBtn}>
            Download as HTML
          </button>
          <button onClick={() => window.print()} style={styles.printBtn}>
            Print Cookbook
          </button>
        </div>
      </div>

      <div style={styles.bookPreviewWrap}>
        <div style={styles.bookPreview}>
          <div style={styles.bookCover}>
            <div style={styles.coverMark}>BF</div>
            <h1 style={styles.coverTitle}>Bever Family<br />Recipes</h1>
            <div style={styles.coverDivider}>
              <span style={styles.coverDivLine}></span>
              <span style={styles.coverDivIcon}>✦</span>
              <span style={styles.coverDivLine}></span>
            </div>
            <p style={styles.coverSubtitle}>A Collection of Treasured Recipes</p>
            <p style={styles.coverYear}>{new Date().getFullYear()}</p>
          </div>

          {groupedRecipes.length > 0 && (
            <div style={styles.tocSection}>
              <h2 style={styles.tocTitle}>Contents</h2>
              {groupedRecipes.map(cat => (
                <div key={cat.id} style={styles.tocCategory}>
                  <h3 style={styles.tocCatName}>{cat.name}</h3>
                  <ul style={styles.tocList}>
                    {cat.recipes.map(r => (
                      <li key={r.id} style={styles.tocItem}>{r.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Generate printable HTML
function generateBookHTML(recipes, categories) {
  const grouped = categories
    .filter(c => c.id !== 'all')
    .map(cat => ({ ...cat, recipes: recipes.filter(r => r.category === cat.id) }))
    .filter(cat => cat.recipes.length > 0);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bever Family Recipes</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Montserrat', sans-serif; color: #3d3d3d; line-height: 1.7; background: #fdfcfa; }
    .cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f5f3ef; page-break-after: always; text-align: center; padding: 40px; }
    .cover-mark { font-family: 'Cormorant Garamond', serif; font-size: 48px; color: #8a9a8e; margin-bottom: 24px; letter-spacing: 4px; }
    .cover h1 { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 400; color: #3d3d3d; margin-bottom: 20px; line-height: 1.2; }
    .cover-div { display: flex; align-items: center; gap: 16px; margin: 20px 0; }
    .cover-line { width: 60px; height: 1px; background: #c9c4bc; }
    .cover-icon { color: #8a9a8e; font-size: 14px; }
    .cover p { color: #7a7a7a; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
    .cover .year { margin-top: 40px; font-size: 14px; }
    .toc { padding: 60px; page-break-after: always; }
    .toc h2 { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #3d3d3d; margin-bottom: 32px; text-align: center; }
    .toc-cat { margin-bottom: 24px; }
    .toc-cat h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #8a9a8e; margin-bottom: 8px; }
    .toc-cat ul { list-style: none; }
    .toc-cat li { padding: 4px 0; font-size: 14px; color: #5a5a5a; padding-left: 16px; }
    .divider-page { height: 100vh; display: flex; justify-content: center; align-items: center; background: #f5f3ef; page-break-after: always; }
    .divider-page h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #3d3d3d; }
    .recipe { padding: 40px 60px; page-break-inside: avoid; }
    .recipe-img { width: 100%; height: 250px; object-fit: cover; border-radius: 4px; margin-bottom: 24px; }
    .recipe h3 { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #3d3d3d; margin-bottom: 8px; }
    .recipe .author { font-style: italic; color: #8a9a8e; margin-bottom: 16px; font-size: 14px; }
    .recipe .meta { display: flex; gap: 24px; font-size: 13px; color: #7a7a7a; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e8e6e2; }
    .recipe-body { display: grid; grid-template-columns: 1fr 2fr; gap: 40px; }
    .recipe h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a9a8e; margin-bottom: 12px; }
    .recipe ul { list-style: none; }
    .recipe ul li { padding: 8px 0; border-bottom: 1px dotted #e8e6e2; font-size: 14px; }
    .recipe ol { padding-left: 20px; }
    .recipe ol li { padding: 10px 0; font-size: 14px; }
    .recipe .notes { grid-column: 1 / -1; background: #f9f8f6; padding: 20px; margin-top: 24px; border-left: 3px solid #8a9a8e; font-style: italic; font-size: 14px; color: #5a5a5a; }
    @media print { .recipe { padding: 30px 40px; } }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-mark">BF</div>
    <h1>Bever Family<br>Recipes</h1>
    <div class="cover-div">
      <span class="cover-line"></span>
      <span class="cover-icon">✦</span>
      <span class="cover-line"></span>
    </div>
    <p>A Collection of Treasured Recipes</p>
    <p class="year">${new Date().getFullYear()}</p>
  </div>
  
  <div class="toc">
    <h2>Contents</h2>
    ${grouped.map(cat => `
      <div class="toc-cat">
        <h3>${cat.name}</h3>
        <ul>${cat.recipes.map(r => `<li>${r.title}</li>`).join('')}</ul>
      </div>
    `).join('')}
  </div>
  
  ${grouped.map(cat => `
    <div class="divider-page"><h2>${cat.name}</h2></div>
    ${cat.recipes.map(recipe => `
      <div class="recipe">
        ${recipe.imageUrl ? `<img class="recipe-img" src="${recipe.imageUrl}" alt="${recipe.title}">` : ''}
        <h3>${recipe.title}</h3>
        ${recipe.author ? `<p class="author">A recipe from ${recipe.author}</p>` : ''}
        <div class="meta">
          ${recipe.prepTime ? `<span>Prep: ${recipe.prepTime}</span>` : ''}
          ${recipe.cookTime ? `<span>Cook: ${recipe.cookTime}</span>` : ''}
          ${recipe.servings ? `<span>Serves ${recipe.servings}</span>` : ''}
        </div>
        <div class="recipe-body">
          <div>
            <h4>Ingredients</h4>
            <ul>${(recipe.ingredients || []).map(i => `<li><strong>${i.amount}</strong> ${i.ingredient}</li>`).join('')}</ul>
          </div>
          <div>
            <h4>Instructions</h4>
            <ol>${(recipe.instructions || []).map(s => `<li>${s}</li>`).join('')}</ol>
          </div>
          ${recipe.notes ? `<div class="notes">${recipe.notes}</div>` : ''}
        </div>
      </div>
    `).join('')}
  `).join('')}
</body>
</html>`;
}

// ============================================
// STYLES
// ============================================
const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#fdfcfa',
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#3d3d3d',
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
  loadingText: { color: '#7a7a7a', fontSize: 14, letterSpacing: 2 },

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
    color: '#3d3d3d',
    lineHeight: 1.1,
  },
  logoSubtitle: { fontSize: 10, letterSpacing: 3, color: '#8a9a8e' },
  nav: { display: 'flex', gap: 32 },
  navLink: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#7a7a7a',
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
    color: '#3d3d3d',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: '8px 0',
    borderBottom: '2px solid #8a9a8e',
  },

  hero: {
    backgroundColor: '#f5f3ef',
    padding: '80px 40px',
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
    fontSize: 52,
    fontWeight: 400,
    color: '#3d3d3d',
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
  heroSubtitle: { fontSize: 15, color: '#7a7a7a', lineHeight: 1.8, marginBottom: 40 },
  searchContainer: { maxWidth: 400, margin: '0 auto' },
  searchInput: {
    width: '100%',
    padding: '16px 24px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    backgroundColor: 'white',
    outline: 'none',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  categorySection: {
    padding: '32px 40px',
    borderBottom: '1px solid #e8e6e2',
    backgroundColor: '#fdfcfa',
  },
  categoryPills: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    maxWidth: 900,
    margin: '0 auto',
  },
  categoryPill: {
    padding: '10px 24px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    color: '#7a7a7a',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  categoryPillActive: {
    padding: '10px 24px',
    background: '#5c6d5e',
    border: '1px solid #5c6d5e',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    color: 'white',
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  recipeSection: { padding: '48px 40px', maxWidth: 1200, margin: '0 auto' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottom: '1px solid #e8e6e2',
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    fontWeight: 400,
    color: '#3d3d3d',
  },
  recipeCount: { fontSize: 13, color: '#9a9a9a', letterSpacing: 0.5 },
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 32,
  },

  recipeCard: {
    background: 'white',
    border: '1px solid #e8e6e2',
    borderRadius: 2,
    overflow: 'hidden',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cardImageContainer: { height: 220, overflow: 'hidden', backgroundColor: '#f5f3ef' },
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
  cardContent: { padding: 24 },
  cardCategory: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 8,
    display: 'block',
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22,
    fontWeight: 400,
    color: '#3d3d3d',
    marginBottom: 8,
    lineHeight: 1.3,
  },
  cardAuthor: { fontSize: 13, color: '#9a9a9a', fontStyle: 'italic', marginBottom: 12 },
  cardMeta: { fontSize: 12, color: '#9a9a9a', display: 'flex', alignItems: 'center' },
  cardMetaDot: { margin: '0 8px' },

  emptyState: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 32, color: '#c9c4bc', marginBottom: 24 },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 28,
    color: '#3d3d3d',
    marginBottom: 12,
  },
  emptyText: { color: '#7a7a7a', marginBottom: 32, fontSize: 15 },
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
    padding: '60px 40px',
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
    color: '#3d3d3d',
    marginBottom: 8,
  },
  footerTagline: { fontSize: 13, color: '#9a9a9a', fontStyle: 'italic' },

  addPage: { maxWidth: 700, margin: '0 auto', padding: '48px 24px' },
  addPageHeader: { textAlign: 'center', marginBottom: 40 },
  addPageTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36,
    color: '#3d3d3d',
    marginBottom: 8,
  },
  addPageSubtitle: { color: '#9a9a9a', fontSize: 14 },
  tabs: {
    display: 'flex',
    marginBottom: 32,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: '16px 20px',
    background: 'white',
    border: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#7a7a7a',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  tabActive: {
    flex: 1,
    padding: '16px 20px',
    background: '#5c6d5e',
    border: 'none',
    fontSize: 13,
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
  },
  scanIcon: { fontSize: 32, color: '#8a9a8e', marginBottom: 16 },
  scanTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24,
    color: '#3d3d3d',
    marginBottom: 12,
  },
  scanText: { color: '#7a7a7a', fontSize: 14, marginBottom: 24, lineHeight: 1.7 },
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
  websiteHint: { fontSize: 12, color: '#9a9a9a', marginBottom: 8, fontStyle: 'italic' },
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
    color: '#9a9a9a',
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
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  formRow3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 },
  formGroup: { marginBottom: 20 },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#5a5a5a',
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
  },

  photoUploadArea: {},
  photoPreviewContainer: { position: 'relative', maxWidth: 400 },
  photoPreview: { width: '100%', height: 250, objectFit: 'cover', borderRadius: 2 },
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
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    maxWidth: 400,
  },
  photoIcon: { fontSize: 32, color: '#c9c4bc', display: 'block', marginBottom: 12 },
  photoText: { fontSize: 13, color: '#9a9a9a' },

  ingredientRow: { display: 'flex', gap: 12, marginBottom: 12 },
  amountInput: {
    width: 100,
    padding: '12px 14px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
  },
  ingredientInput: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    outline: 'none',
    fontFamily: 'inherit',
  },
  removeBtn: {
    width: 40,
    height: 40,
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    cursor: 'pointer',
    fontSize: 18,
    color: '#9a9a9a',
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
    color: '#7a7a7a',
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
    color: '#7a7a7a',
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
    color: '#7a7a7a',
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
  },
  backBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 13,
    color: '#7a7a7a',
    cursor: 'pointer',
  },
  detailActions: { display: 'flex', gap: 8 },
  actionBtn: {
    padding: '10px 16px',
    background: 'white',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 12,
    color: '#7a7a7a',
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
    color: '#3d3d3d',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  detailAuthor: { fontSize: 15, color: '#9a9a9a', fontStyle: 'italic', marginBottom: 24 },
  detailMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: 32,
    fontSize: 13,
    color: '#7a7a7a',
  },
  detailDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    margin: '32px 0',
  },
  dividerLine: { width: 60, height: 1, backgroundColor: '#e8e6e2' },
  dividerIcon: { color: '#c9c4bc', fontSize: 12 },
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
    color: '#5a5a5a',
  },
  instructionsList: { paddingLeft: 20 },
  instructionItem: { padding: '12px 0', fontSize: 14, color: '#5a5a5a', lineHeight: 1.8 },
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
  notesContent: { fontSize: 14, color: '#5a5a5a', lineHeight: 1.8, fontStyle: 'italic' },

  bookPage: { padding: 48, maxWidth: 1000, margin: '0 auto' },
  bookHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  bookTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32,
    color: '#3d3d3d',
    marginBottom: 8,
  },
  bookSubtitle: { color: '#9a9a9a', fontSize: 14 },
  bookActions: { display: 'flex', gap: 12 },
  downloadBtn: {
    padding: '14px 24px',
    background: 'white',
    border: '1px solid #d9d6d0',
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 0.5,
    cursor: 'pointer',
    color: '#7a7a7a',
  },
  printBtn: {
    padding: '14px 28px',
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
  bookPreviewWrap: {
    background: '#e8e6e2',
    padding: 48,
    display: 'flex',
    justifyContent: 'center',
  },
  bookPreview: {
    width: 480,
    background: 'white',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    padding: 48,
  },
  bookCover: {
    textAlign: 'center',
    paddingBottom: 40,
    borderBottom: '1px solid #e8e6e2',
    marginBottom: 40,
  },
  coverMark: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 36,
    color: '#8a9a8e',
    letterSpacing: 4,
    marginBottom: 24,
  },
  coverTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 32,
    fontWeight: 400,
    color: '#3d3d3d',
    lineHeight: 1.3,
    marginBottom: 20,
  },
  coverDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  coverDivLine: { width: 40, height: 1, backgroundColor: '#d9d6d0' },
  coverDivIcon: { color: '#c9c4bc', fontSize: 10 },
  coverSubtitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#9a9a9a',
    marginBottom: 16,
  },
  coverYear: { fontSize: 14, color: '#c9c4bc', marginTop: 24 },
  tocSection: {},
  tocTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 20,
    color: '#3d3d3d',
    marginBottom: 24,
    textAlign: 'center',
  },
  tocCategory: { marginBottom: 20 },
  tocCatName: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8a9a8e',
    marginBottom: 8,
  },
  tocList: { listStyle: 'none', paddingLeft: 12 },
  tocItem: { fontSize: 13, color: '#7a7a7a', padding: '4px 0' },
};
