import React, { useState } from 'react';
import { styles } from '../styles/styles';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import { formatAuthorDisplay } from '../utils/helpers';

export default function RecipeCard({ 
  recipe, 
  isFavorite, 
  onToggleFavorite, 
  onClick 
}) {
  const [imageError, setImageError] = useState(false);
  
  const category = DEFAULT_CATEGORIES.find(c => c.id === recipe.category);
  
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(recipe.id);
  };

  const getTimeDisplay = () => {
    const times = [];
    if (recipe.prepTime) times.push(recipe.prepTime);
    if (recipe.cookTime) times.push(recipe.cookTime);
    return times.join(' + ') || null;
  };

  return (
    <article 
      style={styles.recipeCard} 
      className="recipe-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`View recipe: ${recipe.title}`}
    >
      <div style={styles.cardImageContainer}>
        {recipe.imageUrl && !imageError ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            style={styles.cardImage}
            className="card-image"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : recipe.handwrittenImageUrl && !imageError ? (
          <img
            src={recipe.handwrittenImageUrl}
            alt={`${recipe.title} - handwritten recipe`}
            style={styles.cardImage}
            className="card-image"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={styles.cardPlaceholder}>
            <span style={styles.placeholderIcon}>✦</span>
          </div>
        )}
        <button
          style={{
            ...styles.favoriteBtn,
            color: isFavorite ? '#c75050' : '#b8956b'
          }}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
          <p style={styles.cardAuthor}>
            {formatAuthorDisplay(recipe.author, recipe.authorIsFamily)}
          </p>
        )}
        <div style={styles.cardMeta}>
          {getTimeDisplay() && <span>{getTimeDisplay()}</span>}
          {getTimeDisplay() && recipe.servings && <span style={{color: '#d5d0c5'}}>·</span>}
          {recipe.servings && <span>Serves {recipe.servings}</span>}
          {recipe.madeIt && recipe.madeIt.length > 0 && (
            <>
              <span style={{color: '#d5d0c5'}}>·</span>
              <span style={{color: '#5c6d5e'}}>✓ {recipe.madeIt.length} made</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
