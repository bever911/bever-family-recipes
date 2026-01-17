import React, { useEffect } from 'react';
import { styles } from '../styles/styles';
import { formatDate } from '../utils/helpers';

export default function TrashPage({
  recipes,
  onRestore,
  onDelete,
  onEmptyTrash,
  onBack
}) {
  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={styles.trashPage}>
      <div style={styles.trashHeader}>
        <h1 style={styles.trashTitle}>Trash</h1>
        <p style={styles.trashSubtitle}>
          {recipes.length === 0 
            ? 'No recipes in trash' 
            : `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} in trash`
          }
        </p>
      </div>

      {recipes.length > 0 && (
        <>
          <p style={styles.trashWarning}>
            ⚠ Emptying trash permanently deletes all recipes and cannot be undone.
          </p>

          <div style={{marginBottom: 32, textAlign: 'center'}}>
            <button onClick={onEmptyTrash} style={styles.emptyTrashBtn}>
              Empty Trash
            </button>
          </div>

          <div>
            {recipes.map(recipe => (
              <div key={recipe.id} style={styles.trashItem}>
                <div>
                  <h3 style={styles.trashItemTitle}>{recipe.title}</h3>
                  <p style={styles.trashItemMeta}>
                    Deleted {formatDate(recipe.trashedAt)}
                  </p>
                </div>
                <div style={styles.trashItemActions}>
                  <button 
                    onClick={() => onRestore(recipe)}
                    style={styles.restoreBtn}
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Permanently delete "${recipe.title}"? This cannot be undone.`)) {
                        onDelete(recipe);
                      }
                    }}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {recipes.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🗑</div>
          <p style={styles.emptyTitle}>Trash is empty</p>
          <p style={styles.emptyText}>Deleted recipes will appear here</p>
        </div>
      )}

      <div style={{textAlign: 'center', marginTop: 40}}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Back to Recipes
        </button>
      </div>
    </div>
  );
}
