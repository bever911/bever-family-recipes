import React, { useState, useEffect } from 'react';
import { styles } from '../styles/styles';
import { DEFAULT_CATEGORIES, FRACTION_MAP } from '../utils/constants';
import { formatAuthorDisplay, formatDate, formatQtyDisplay } from '../utils/helpers';

export default function RecipeDetail({
  recipe,
  isFamily,
  isFavorite,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddComment,
  onDeleteComment,
  onMadeIt,
  showNotification
}) {
  const [imageError, setImageError] = useState(false);
  const [handwrittenImageError, setHandwrittenImageError] = useState(false);
  const [showHandwrittenModal, setShowHandwrittenModal] = useState(false);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [showMadeItForm, setShowMadeItForm] = useState(false);
  const [madeItName, setMadeItName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  const category = DEFAULT_CATEGORIES.find(c => c.id === recipe.category);

  // Scroll to top when viewing recipe
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [recipe.id]);

  // Scale ingredient amount
  const scaleIngredientAmount = (amount, multiplier = 1) => {
    if (!amount || multiplier === 1) return amount;
    
    const numMatch = amount.match(/^([\d.\/\s½⅓⅔¼¾⅛⅜⅝⅞]+)\s*(.*)$/);
    if (!numMatch) return amount;
    
    let numStr = numMatch[1].trim();
    const rest = numMatch[2];
    
    let value = 0;
    
    for (const [frac, dec] of Object.entries(FRACTION_MAP)) {
      if (numStr.includes(frac)) {
        const parts = numStr.split(frac);
        const whole = parts[0] ? parseFloat(parts[0]) || 0 : 0;
        value = whole + dec;
        break;
      }
    }
    
    if (value === 0) {
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

  // Format ingredient for display
  // Helper to parse qty string that might be a fraction
  const parseQtyString = (qtyStr) => {
    if (!qtyStr) return 0;
    
    // Check for unicode fractions first
    for (const [frac, dec] of Object.entries(FRACTION_MAP)) {
      if (qtyStr.includes(frac)) {
        const parts = qtyStr.split(frac);
        const whole = parts[0] ? parseFloat(parts[0]) || 0 : 0;
        return whole + dec;
      }
    }
    
    // Check for slash fractions like "3/4" or "1 1/2"
    const mixedMatch = qtyStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const num = parseFloat(mixedMatch[2]);
      const den = parseFloat(mixedMatch[3]);
      return whole + (num / den);
    }
    
    const fractionMatch = qtyStr.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      return parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
    }
    
    // Regular number
    return parseFloat(qtyStr) || 0;
  };

  const formatIngredient = (ing, multiplier = 1) => {
    // New format: {qty, unit, ingredient}
    if (ing.qty !== undefined) {
      let displayQty = '';
      const qtyStr = String(ing.qty || '').trim();
      
      // Check if qty contains a range
      const isRange = /^\d+\s*(-|to)\s*\d+$/.test(qtyStr);
      
      if (isRange && multiplier === 1) {
        displayQty = qtyStr;
      } else if (isRange && multiplier !== 1) {
        const rangeMatch = qtyStr.match(/^(\d+)\s*(-|to)\s*(\d+)$/);
        if (rangeMatch) {
          const low = parseFloat(rangeMatch[1]) * multiplier;
          const separator = rangeMatch[2];
          const high = parseFloat(rangeMatch[3]) * multiplier;
          displayQty = `${formatQtyDisplay(low)}${separator}${formatQtyDisplay(high)}`;
        }
      } else if (qtyStr) {
        const parsedQty = parseQtyString(qtyStr);
        const scaledQty = parsedQty * multiplier;
        displayQty = scaledQty > 0 ? formatQtyDisplay(scaledQty) : qtyStr;
      }
      
      return {
        amount: `${displayQty} ${ing.unit || ''}`.trim(),
        ingredient: ing.ingredient || ''
      };
    }
    // Old format: {amount, ingredient}
    return {
      amount: scaleIngredientAmount(ing.amount, multiplier),
      ingredient: ing.ingredient || ''
    };
  };

  const handlePrint = () => {
    setServingsMultiplier(1);
    setTimeout(() => window.print(), 100);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.title, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      showNotification('Link copied to clipboard!');
    }
  };

  const handleMadeIt = () => {
    if (madeItName.trim()) {
      onMadeIt(recipe.id, madeItName.trim());
      setMadeItName('');
      setShowMadeItForm(false);
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(recipe.id, {
        text: commentText.trim(),
        author: commentAuthor.trim() || 'Anonymous'
      });
      setCommentText('');
      setCommentAuthor('');
    }
  };

  return (
    <div style={styles.detailPage} className="detail-page">
      {/* Navigation */}
      <div style={styles.detailNav} className="no-print">
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <div style={styles.detailActions} className="detail-actions">
          <button 
            onClick={() => onToggleFavorite(recipe.id)} 
            style={{...styles.actionBtn, color: isFavorite ? '#c75050' : '#5a5a5a'}}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
          <button onClick={handleShare} style={styles.actionBtn}>Share</button>
          <button onClick={handlePrint} style={styles.printBtn}>Print</button>
          {isFamily && (
            <>
              <button onClick={onEdit} style={styles.actionBtn}>Edit</button>
              <button onClick={() => onDelete(recipe)} style={styles.deleteBtn}>Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Recipe Content */}
      <article style={styles.recipeDetail} className="print-recipe">
        {/* Main Image */}
        {recipe.imageUrl && !imageError && (
          <div style={styles.detailImageWrap} className="print-image">
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title}
              style={styles.detailImage}
              onError={() => setImageError(true)}
            />
            {recipe.imageCaption && (
              <p style={styles.imageCaption} className="image-caption">{recipe.imageCaption}</p>
            )}
          </div>
        )}

        <div style={styles.detailContent} className="detail-content">
          {/* Header */}
          <header style={styles.detailHeader}>
            {category && <span style={styles.detailCategory}>{category.name}</span>}
            <h1 style={styles.detailTitle} className="detail-title">{recipe.title}</h1>
            {recipe.author && (
              <p style={styles.detailAuthor}>
                {formatAuthorDisplay(recipe.author, recipe.authorIsFamily)}
              </p>
            )}
            
            <div style={styles.detailMeta} className="detail-meta">
              {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
              {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
              {recipe.servings && <span>Serves {recipe.servings}</span>}
              {recipe.dateAdded && <span>Added: {formatDate(recipe.dateAdded)}</span>}
            </div>

            {/* Source URL for imported recipes */}
            {recipe.sourceUrl && (
              <p style={{fontSize: 12, color: '#9a9a8a', marginTop: 12}}>
                Source: <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{color: '#b8956b'}}>{recipe.sourceUrl}</a>
              </p>
            )}
            
            {/* Made It section */}
            {isFamily && (
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
                      onKeyDown={(e) => e.key === 'Enter' && handleMadeIt()}
                    />
                    <button onClick={handleMadeIt} style={styles.madeItSubmit}>Add</button>
                    <button onClick={() => setShowMadeItForm(false)} style={styles.madeItCancel}>✕</button>
                  </div>
                )}
              </div>
            )}
            
            {/* Show made it list for non-family users */}
            {!isFamily && recipe.madeIt && recipe.madeIt.length > 0 && (
              <div style={styles.madeItSection} className="no-print">
                <p style={styles.madeItList}>
                  ✓ Made by: {recipe.madeIt.map(m => m.name).join(', ')}
                </p>
              </div>
            )}
          </header>

          {/* Servings Scaler */}
          {recipe.servings && (
            <div style={styles.scalerContainer} className="no-print">
              <span style={styles.scalerLabel}>Adjust:</span>
              <div style={styles.scalerButtons}>
                {[0.5, 1, 2, 3].map(mult => (
                  <button 
                    key={mult}
                    style={{
                      ...styles.scalerBtn,
                      ...(servingsMultiplier === mult ? styles.scalerBtnActive : {})
                    }}
                    onClick={() => setServingsMultiplier(mult)}
                  >
                    {mult === 0.5 ? '½' : mult}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          <div style={styles.sectionSeparator}>
            <span style={styles.separatorLine}></span>
            <span style={styles.separatorIcon}>✦</span>
            <span style={styles.separatorLine}></span>
          </div>

          {/* Ingredients & Instructions */}
          <div style={styles.detailBody} className="detail-body">
            <section className="ingredients-col">
              <h2 style={styles.colTitle} className="col-title">Ingredients</h2>
              <ul style={styles.ingredientsList}>
                {recipe.ingredients?.map((ing, i) => {
                  const formatted = formatIngredient(ing, servingsMultiplier);
                  return (
                    <li key={i} style={styles.ingredientItem} className="ingredient-item">
                      <strong style={{color: '#3d3d3d', fontWeight: 600}}>{formatted.amount}</strong> {formatted.ingredient}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="instructions-col">
              <h2 style={styles.colTitle} className="col-title">Instructions</h2>
              <ol style={styles.instructionsList}>
                {recipe.instructions?.map((inst, i) => (
                  <li key={i} style={styles.instructionItem} className="instruction-item">
                    <span style={styles.instructionNumber}>{i + 1}</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Notes */}
          {recipe.notes && (
            <section style={styles.notesBox} className="notes-box">
              <h3 style={styles.notesTitle}>Tips & Notes</h3>
              <p style={styles.notesContent}>{recipe.notes}</p>
            </section>
          )}

          {/* Story */}
          {recipe.story && (
            <section style={styles.storyBox} className="story-box">
              <h3 style={styles.storyTitle}>The Story</h3>
              <p style={styles.storyContent}>{recipe.story}</p>
            </section>
          )}

          {/* Handwritten Recipe Card */}
          {recipe.handwrittenImageUrl && !handwrittenImageError && (
            <section style={styles.handwrittenSection} className="handwritten-section">
              <h3 style={styles.handwrittenTitle}>Original Recipe Card</h3>
              <img 
                src={recipe.handwrittenImageUrl}
                alt="Original handwritten recipe"
                style={styles.handwrittenThumb}
                onClick={() => setShowHandwrittenModal(true)}
                onError={() => setHandwrittenImageError(true)}
              />
              {recipe.handwrittenImageCaption && (
                <p style={styles.handwrittenCaption}>{recipe.handwrittenImageCaption}</p>
              )}
              <p style={styles.handwrittenHint} className="no-print">Click to enlarge</p>
            </section>
          )}

          {/* Comments Section */}
          {isFamily && (
            <section style={styles.commentsSection} className="no-print">
              <h3 style={styles.commentsTitle}>
                Family Notes ({recipe.comments?.length || 0})
              </h3>
              
              {recipe.comments?.map(comment => (
                <div key={comment.id} style={styles.commentItem}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <p style={styles.commentAuthor}>{comment.author}</p>
                      <p style={styles.commentDate}>{formatDate(comment.date)}</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Remove this note?')) {
                          onDeleteComment(recipe.id, comment.id);
                        }
                      }}
                      style={{background: 'none', border: 'none', color: '#9a9a8a', cursor: 'pointer'}}
                    >
                      ✕
                    </button>
                  </div>
                  <p style={styles.commentText}>{comment.text}</p>
                </div>
              ))}
              
              <div style={styles.commentForm}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a family note..."
                  style={styles.commentTextarea}
                />
                <div style={styles.commentSubmitRow}>
                  <input
                    type="text"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="Your name"
                    style={styles.commentNameInput}
                  />
                  <button onClick={handleAddComment} style={styles.commentSubmitBtn}>
                    Add Note
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </article>

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
    </div>
  );
}
