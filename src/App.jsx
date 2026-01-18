// ============================================
// BEVER FAMILY RECIPES - MAIN APP
// ============================================
import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './utils/firebase';
import { styles } from './styles/styles';
import { 
  DEFAULT_CATEGORIES, 
  SORT_OPTIONS, 
  FAMILY_CODE,
  UNIT_MAPPINGS
} from './utils/constants';
import { 
  getLocalStorage, 
  setLocalStorage, 
  normalizeUnit,
  parseIngredientString
} from './utils/helpers';
import { useDebounce } from './hooks/useDebounce';
import './styles/global.css';

// Components
import Header from './components/Header';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';
import AddRecipe from './components/AddRecipe';
import TrashPage from './components/TrashPage';

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  // Data state
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [isFamily, setIsFamily] = useState(() => getLocalStorage('bfr-isFamily', false));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  
  // Navigation state
  const [currentView, setCurrentView] = useState('home');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Use debounced search (300ms delay)
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // UI state
  const [favorites, setFavorites] = useState(() => getLocalStorage('bfr-favorites', []));
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);

  // ============================================
  // FIREBASE SYNC
  // ============================================
  useEffect(() => {
    const q = query(collection(db, 'recipes'), orderBy('dateAdded', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(data);
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      showNotification('Error loading recipes', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================
  // URL HASH HANDLING
  // ============================================
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#recipe-')) {
        const recipeId = hash.replace('#recipe-', '');
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe && !recipe.trashedAt) {
          setSelectedRecipe(recipe);
          setCurrentView('detail');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [recipes]);

  // ============================================
  // NOTIFICATIONS
  // ============================================
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ============================================
  // AUTH
  // ============================================
  const handleFamilyLogin = () => {
    if (loginCode.toLowerCase() === FAMILY_CODE) {
      setIsFamily(true);
      setLocalStorage('bfr-isFamily', true);
      setShowLoginModal(false);
      setLoginCode('');
      showNotification('Welcome, family! 👨‍👩‍👧‍👦');
    } else {
      showNotification('Incorrect code', 'error');
    }
  };

  const handleLogout = () => {
    setIsFamily(false);
    setLocalStorage('bfr-isFamily', false);
    showNotification('Logged out');
  };

  // ============================================
  // NAVIGATION - with scroll to top
  // ============================================
  const navigateTo = (view, data = null) => {
    // Scroll to top on every navigation
    window.scrollTo(0, 0);
    
    if (view === 'detail' && data) {
      setSelectedRecipe(data);
      window.history.pushState(null, '', `#recipe-${data.id}`);
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
    
    if (view === 'edit' && data) {
      setEditingRecipe(data);
      setCurrentView('add');
    } else if (view === 'export') {
      exportRecipes();
    } else {
      setCurrentView(view);
      if (view !== 'detail') {
        setSelectedRecipe(null);
      }
      if (view !== 'add') {
        setEditingRecipe(null);
      }
    }
  };

  // ============================================
  // FAVORITES
  // ============================================
  const toggleFavorite = (recipeId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId];
      setLocalStorage('bfr-favorites', newFavorites);
      return newFavorites;
    });
  };

  // ============================================
  // RECIPE CRUD
  // ============================================
  const saveRecipe = async (recipeData) => {
    try {
      if (recipeData.id) {
        // Update existing
        const { id, ...data } = recipeData;
        await updateDoc(doc(db, 'recipes', id), data);
        showNotification('Recipe updated!');
      } else {
        // Create new
        const newRecipe = {
          ...recipeData,
          dateAdded: new Date().toISOString(),
        };
        delete newRecipe.id;
        await addDoc(collection(db, 'recipes'), newRecipe);
        showNotification('Recipe added!');
      }
      navigateTo('home');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Error saving recipe', 'error');
    }
  };

  const trashRecipe = async (recipe) => {
    if (!confirm('Move this recipe to trash?')) return;
    try {
      await updateDoc(doc(db, 'recipes', recipe.id), {
        trashedAt: new Date().toISOString()
      });
      showNotification('Recipe moved to trash');
      navigateTo('home');
    } catch (error) {
      console.error('Trash error:', error);
      showNotification('Error trashing recipe', 'error');
    }
  };

  const restoreRecipe = async (recipe) => {
    try {
      await updateDoc(doc(db, 'recipes', recipe.id), {
        trashedAt: null
      });
      showNotification('Recipe restored!');
    } catch (error) {
      console.error('Restore error:', error);
      showNotification('Error restoring recipe', 'error');
    }
  };

  const permanentlyDeleteRecipe = async (recipe) => {
    try {
      // Delete images from storage
      if (recipe.imageUrl) {
        try {
          const imageRef = ref(storage, recipe.imageUrl);
          await deleteObject(imageRef);
        } catch (e) { /* Image might not exist */ }
      }
      if (recipe.handwrittenImageUrl) {
        try {
          const handwrittenRef = ref(storage, recipe.handwrittenImageUrl);
          await deleteObject(handwrittenRef);
        } catch (e) { /* Image might not exist */ }
      }
      
      await deleteDoc(doc(db, 'recipes', recipe.id));
      showNotification('Recipe permanently deleted');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Error deleting recipe', 'error');
    }
  };

  const emptyTrash = async () => {
    if (!confirm(`Permanently delete ${trashedRecipes.length} recipe(s) from trash? This cannot be undone.`)) return;
    
    setIsProcessing(true);
    try {
      for (const recipe of trashedRecipes) {
        await permanentlyDeleteRecipe(recipe);
      }
      showNotification('Trash emptied');
    } catch (error) {
      console.error('Empty trash error:', error);
      showNotification('Error emptying trash', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // COMMENTS & MADE IT
  // ============================================
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

  // ============================================
  // ADMIN TOOLS
  // ============================================
  const migrateIngredientsFormat = async () => {
    if (!confirm('This will convert old scanned ingredients where "4 cup" is in one column. Continue?')) return;
    
    setIsProcessing(true);
    let updated = 0;
    
    try {
      for (const recipe of recipes) {
        if (!recipe.ingredients || recipe.ingredients.length === 0) continue;
        
        // Check if any ingredient needs migration (has amount field but no qty)
        const needsMigration = recipe.ingredients.some(ing => 
          (ing.amount !== undefined && ing.qty === undefined) ||
          (ing.qty && ing.qty.includes(' ')) // qty has space = needs splitting
        );
        if (!needsMigration) continue;
        
        const newIngredients = recipe.ingredients.map(ing => {
          // If already has qty field and it doesn't need splitting, keep as-is
          if (ing.qty !== undefined && !ing.qty.includes(' ')) {
            return { 
              qty: ing.qty || '', 
              unit: normalizeUnit(ing.unit) || '', 
              ingredient: ing.ingredient || '' 
            };
          }
          
          // Parse from amount field or qty field that has space
          const textToParse = ing.amount || ing.qty || '';
          const ingredientText = ing.ingredient || '';
          
          const parsed = parseIngredientString(textToParse);
          
          return {
            qty: parsed.quantity || '',
            unit: normalizeUnit(parsed.unit) || '',
            ingredient: parsed.item || ingredientText
          };
        });
        
        await updateDoc(doc(db, 'recipes', recipe.id), { ingredients: newIngredients });
        updated++;
      }
      showNotification(`Migrated ${updated} recipes to new format`);
    } catch (error) {
      console.error('Migration error:', error);
      showNotification('Error migrating recipes', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // EXPORT
  // ============================================
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

  // ============================================
  // FILTERED DATA
  // ============================================
  const activeRecipes = useMemo(() => 
    recipes.filter(r => !r.trashedAt), 
    [recipes]
  );
  
  const trashedRecipes = useMemo(() => 
    recipes.filter(r => r.trashedAt), 
    [recipes]
  );

  const filteredRecipes = useMemo(() => {
    return activeRecipes
      .filter(recipe => {
        const query = debouncedSearch.toLowerCase();
        const ingredientMatches = recipe.ingredients?.some(i => 
          i.ingredient?.toLowerCase().includes(query) ||
          i.amount?.toLowerCase().includes(query) ||
          i.unit?.toLowerCase().includes(query) ||
          i.qty?.toLowerCase?.().includes(query)
        );
        const matchesSearch = !debouncedSearch || 
          recipe.title?.toLowerCase().includes(query) ||
          ingredientMatches ||
          recipe.author?.toLowerCase().includes(query) ||
          recipe.notes?.toLowerCase().includes(query) ||
          recipe.story?.toLowerCase().includes(query);
        const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
        const matchesAuthor = selectedAuthor === 'all' || recipe.author === selectedAuthor;
        const matchesFavorites = !showFavoritesOnly || favorites.includes(recipe.id);
        return matchesSearch && matchesCategory && matchesAuthor && matchesFavorites;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest': return new Date(a.dateAdded) - new Date(b.dateAdded);
          case 'newest': return new Date(b.dateAdded) - new Date(a.dateAdded);
          case 'a-z': return (a.title || '').localeCompare(b.title || '');
          case 'z-a': return (b.title || '').localeCompare(a.title || '');
          case 'category': return (a.category || '').localeCompare(b.category || '') || (a.title || '').localeCompare(b.title || '');
          default: return 0;
        }
      });
  }, [activeRecipes, debouncedSearch, selectedCategory, selectedAuthor, sortBy, showFavoritesOnly, favorites]);

  const uniqueAuthors = useMemo(() => {
    const authors = [...new Set(
      activeRecipes
        .filter(r => r.author && r.showInAuthorFilter !== false) // Only include if showInAuthorFilter is true or undefined
        .map(r => r.author)
    )];
    return authors.sort();
  }, [activeRecipes]);

  // ============================================
  // LOADING SCREEN
  // ============================================
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={styles.app}>
      {/* Header */}
      <Header
        isFamily={isFamily}
        currentView={currentView}
        onNavigate={navigateTo}
        onFamilyLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        trashedCount={trashedRecipes.length}
      />

      {/* Main Content */}
      <main>
        {/* Home View */}
        {currentView === 'home' && !selectedRecipe && (
          <>
            {/* Hero Section */}
            <section style={styles.hero} className="hero-section">
              <p style={styles.heroWelcome}>Welcome to the</p>
              <h1 style={styles.heroTitle}>Bever Family Recipes</h1>
              <div style={styles.divider}>
                <span style={styles.dividerLine}></span>
                <span style={styles.dividerIcon}>✦</span>
                <span style={styles.dividerLine}></span>
              </div>
              <p style={styles.heroSubtitle}>
                A collection of treasured recipes passed down through generations.<br />
                From our kitchen to yours.
              </p>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes, ingredients, stories..."
                  style={styles.searchInput}
                  aria-label="Search recipes"
                />
              </div>
            </section>

            {/* Category Pills */}
            <section style={styles.categorySection} className="category-section">
              <div style={styles.categoryPills} className="category-pills">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    style={{
                      ...styles.categoryPill,
                      ...(selectedCategory === cat.id ? styles.categoryPillActive : {})
                    }}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Recipe Grid */}
            <section style={styles.recipeSection} className="recipe-section">
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>
                  {selectedCategory === 'all' ? 'All Recipes' : DEFAULT_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </h2>
                <span style={styles.recipeCount}>{filteredRecipes.length} recipes</span>
              </div>

              {/* Filters */}
              <div style={styles.filterRow} className="filter-row">
                <div style={styles.filterGroup}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={styles.filterSelect}
                    aria-label="Sort recipes"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  
                  {uniqueAuthors.length > 1 && (
                    <select
                      value={selectedAuthor}
                      onChange={(e) => setSelectedAuthor(e.target.value)}
                      style={styles.filterSelect}
                      aria-label="Filter by author"
                    >
                      <option value="all">All Authors</option>
                      {uniqueAuthors.map(author => (
                        <option key={author} value={author}>{author}</option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  style={{
                    ...styles.favoritesToggle,
                    ...(showFavoritesOnly ? styles.favoritesToggleActive : {})
                  }}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  {showFavoritesOnly ? '♥ Favorites' : '♡ Favorites'}
                </button>
              </div>

              {/* Recipe Cards */}
              {filteredRecipes.length > 0 ? (
                <div style={styles.recipeGrid} className="recipe-grid">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={favorites.includes(recipe.id)}
                      onToggleFavorite={toggleFavorite}
                      onClick={() => navigateTo('detail', recipe)}
                    />
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>✦</div>
                  <p style={styles.emptyTitle}>No recipes found</p>
                  <p style={styles.emptyText}>Try adjusting your search or filters</p>
                </div>
              )}

              {/* Admin Tools */}
              {isFamily && (
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
                        <button 
                          onClick={migrateIngredientsFormat} 
                          disabled={isProcessing} 
                          style={styles.adminToolBtn}
                        >
                          {isProcessing ? 'Processing...' : 'Split Qty/Unit'}
                        </button>
                        {trashedRecipes.length > 0 && (
                          <button 
                            onClick={emptyTrash} 
                            disabled={isProcessing} 
                            style={{...styles.adminToolBtn, backgroundColor: '#9b6b5b'}}
                          >
                            Empty Trash ({trashedRecipes.length})
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#7a7a7a', margin: 0 }}>
                        Split Qty/Unit: Fix old scanned recipes where "4 cup" is in one column
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* Recipe Detail View */}
        {currentView === 'detail' && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            isFamily={isFamily}
            isFavorite={favorites.includes(selectedRecipe.id)}
            onBack={() => navigateTo('home')}
            onEdit={() => navigateTo('edit', selectedRecipe)}
            onDelete={trashRecipe}
            onToggleFavorite={toggleFavorite}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onMadeIt={addMadeIt}
            showNotification={showNotification}
          />
        )}

        {/* Add/Edit View */}
        {currentView === 'add' && (
          <AddRecipe
            recipe={editingRecipe}
            recipes={activeRecipes}
            onSave={saveRecipe}
            onCancel={() => navigateTo('home')}
            showNotification={showNotification}
          />
        )}

        {/* Trash View */}
        {currentView === 'trash' && (
          <TrashPage
            recipes={trashedRecipes}
            onRestore={restoreRecipe}
            onDelete={permanentlyDeleteRecipe}
            onEmptyTrash={emptyTrash}
            onBack={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>BF</div>
        <p style={styles.footerText}>Bever Family Recipes</p>
        <p style={styles.footerTagline}>Gathering around the table, one recipe at a time</p>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div style={styles.loginModal} onClick={() => setShowLoginModal(false)}>
          <div style={styles.loginBox} onClick={e => e.stopPropagation()}>
            <h2 style={styles.loginTitle}>Family Access</h2>
            <p style={styles.loginSubtitle}>Enter the family code to edit recipes</p>
            <input
              type="password"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="Family code"
              style={styles.loginInput}
              onKeyDown={(e) => e.key === 'Enter' && handleFamilyLogin()}
              autoFocus
            />
            <button onClick={handleFamilyLogin} style={styles.loginBtn}>
              Enter
            </button>
            <button onClick={() => setShowLoginModal(false)} style={styles.loginCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div style={{
          ...styles.notification,
          ...(notification.type === 'error' ? styles.notificationError : {})
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
