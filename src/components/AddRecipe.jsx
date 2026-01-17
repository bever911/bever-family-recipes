import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebase';
import { styles } from '../styles/styles';
import { 
  DEFAULT_CATEGORIES, 
  STANDARD_UNITS, 
  EMPTY_RECIPE, 
  MAX_FILE_SIZE 
} from '../utils/constants';
import { normalizeUnit, callRecipeAI, validateFileSize } from '../utils/helpers';

export default function AddRecipe({
  recipe,
  onSave,
  onCancel,
  showNotification,
  recipes // For duplicate detection
}) {
  const [formData, setFormData] = useState(recipe || EMPTY_RECIPE);
  const [activeTab, setActiveTab] = useState('manual');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(recipe?.imageUrl || null);
  const [handwrittenImageFile, setHandwrittenImageFile] = useState(null);
  const [handwrittenImagePreview, setHandwrittenImagePreview] = useState(recipe?.handwrittenImageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [websiteContent, setWebsiteContent] = useState('');
  const [uploadedScanImage, setUploadedScanImage] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragType, setDragType] = useState(null); // 'ingredient' or 'instruction'
  
  // Unit autocomplete state
  const [focusedUnitIndex, setFocusedUnitIndex] = useState(null);
  const [unitFilter, setUnitFilter] = useState('');

  // Track changes for unsaved warning
  useEffect(() => {
    const initialData = JSON.stringify(recipe || EMPTY_RECIPE);
    const currentData = JSON.stringify(formData);
    setHasUnsavedChanges(initialData !== currentData || imageFile || handwrittenImageFile);
  }, [formData, imageFile, handwrittenImageFile, recipe]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ============================================
  // INGREDIENT HANDLING
  // ============================================
  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    
    // Auto-add new row when typing in the last ingredient
    if (index === formData.ingredients.length - 1 && value.trim()) {
      const hasContent = newIngredients[index].qty || newIngredients[index].unit || newIngredients[index].ingredient;
      if (hasContent && !newIngredients[index + 1]) {
        newIngredients.push({ qty: '', unit: '', ingredient: '' });
      }
    }
    
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { qty: '', unit: '', ingredient: '' }]
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

  // ============================================
  // INSTRUCTION HANDLING
  // ============================================
  const updateInstruction = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    
    // Auto-add new row when typing in the last instruction
    if (index === formData.instructions.length - 1 && value.trim()) {
      if (!newInstructions[index + 1]) {
        newInstructions.push('');
      }
    }
    
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
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

  // ============================================
  // DRAG AND DROP
  // ============================================
  const handleDragStart = (index, type) => {
    setDraggedIndex(index);
    setDragType(type);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      if (dragType === 'ingredient') {
        const newIngredients = [...formData.ingredients];
        const [removed] = newIngredients.splice(draggedIndex, 1);
        newIngredients.splice(dragOverIndex, 0, removed);
        setFormData(prev => ({ ...prev, ingredients: newIngredients }));
      } else if (dragType === 'instruction') {
        const newInstructions = [...formData.instructions];
        const [removed] = newInstructions.splice(draggedIndex, 1);
        newInstructions.splice(dragOverIndex, 0, removed);
        setFormData(prev => ({ ...prev, instructions: newInstructions }));
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragType(null);
  };

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageSelect = (e, type = 'main') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!validateFileSize(file, showNotification)) {
      e.target.value = '';
      return;
    }
    
    const preview = URL.createObjectURL(file);
    if (type === 'main') {
      setImageFile(file);
      setImagePreview(preview);
    } else {
      setHandwrittenImageFile(file);
      setHandwrittenImagePreview(preview);
    }
  };

  const uploadImage = async (file, folder) => {
    const filename = `${folder}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  // ============================================
  // AI SCANNING
  // ============================================
  const processUploadedFile = async (file) => {
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      showNotification('Please select an image or PDF file', 'error');
      return;
    }

    if (!validateFileSize(file, showNotification)) {
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

  const handleWebsiteImport = async () => {
    const content = websiteContent.trim();
    if (!content) {
      showNotification('Please paste the recipe content from the website', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Extract URL if present
      const urlMatch = content.match(/https?:\/\/[^\s]+/);
      const sourceUrl = urlMatch ? urlMatch[0] : '';

      const data = await callRecipeAI('extract-website', { content });
      
      const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({ 
          ...prev, 
          ...extracted, 
          authorIsFamily: false,
          sourceUrl: sourceUrl // Add source URL
        }));
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

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showNotification('Please enter a recipe title', 'error');
      return;
    }

    // Check for duplicate recipe (only for new recipes)
    if (!recipe) {
      const duplicate = recipes.find(r => 
        r.title.toLowerCase().trim() === formData.title.toLowerCase().trim() && 
        !r.trashedAt
      );
      if (duplicate) {
        if (!confirm(`A recipe called "${duplicate.title}" already exists. Save anyway?`)) {
          return;
        }
      }
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
        imageCaption: formData.imageCaption || '',
        handwrittenImageUrl,
        handwrittenImageCaption: formData.handwrittenImageCaption || '',
        sourceUrl: formData.sourceUrl || '',
        ingredients: Array.isArray(formData.ingredients) 
          ? formData.ingredients.filter(i => i.amount || i.ingredient || i.qty)
          : [],
        instructions: Array.isArray(formData.instructions)
          ? formData.instructions.filter(i => i && i.trim())
          : [],
        comments: formData.comments || [],
        madeIt: formData.madeIt || [],
      };
      
      setHasUnsavedChanges(false);
      await onSave(cleanedData);
    } catch (error) {
      console.error('Submit error:', error);
      showNotification('Error saving recipe: ' + error.message, 'error');
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    onCancel();
  };

  // Unit autocomplete filtering
  const filteredUnits = STANDARD_UNITS.filter(u => 
    u.toLowerCase().startsWith(unitFilter.toLowerCase())
  );

  return (
    <div style={styles.addPage}>
      <div style={styles.addPageHeader}>
        <h1 style={styles.addPageTitle}>{recipe ? 'Edit Recipe' : 'Add New Recipe'}</h1>
        <p style={styles.addPageSubtitle}>Share a treasured family recipe</p>
      </div>

      {/* Tabs for new recipes */}
      {!recipe && (
        <div style={styles.tabs} className="tabs">
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
            Import website
          </button>
        </div>
      )}

      {/* Scan Tab */}
      {activeTab === 'scan' && (
        <div style={{marginBottom: 32}}>
          <div 
            style={styles.scanUploadArea}
            onClick={() => document.getElementById('scan-file-input').click()}
          >
            {isProcessing ? (
              <div style={{textAlign: 'center'}}>
                <div style={styles.spinner} />
                <p style={{marginTop: 16, color: '#5a5a5a'}}>Reading recipe...</p>
              </div>
            ) : uploadedScanImage ? (
              <img src={uploadedScanImage} alt="Uploaded" style={{maxHeight: 200, maxWidth: '100%'}} />
            ) : uploadedFileName ? (
              <p style={{color: '#5a5a5a'}}>📄 {uploadedFileName}</p>
            ) : (
              <>
                <div style={styles.uploadIcon}>📸</div>
                <p style={styles.uploadText}>Drop an image or PDF here, or click to browse</p>
                <p style={styles.uploadHint}>Supports: JPG, PNG, PDF (max 10MB)</p>
              </>
            )}
          </div>
          <input
            id="scan-file-input"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => e.target.files?.[0] && processUploadedFile(e.target.files[0])}
            style={{display: 'none'}}
          />
        </div>
      )}

      {/* Website Import Tab */}
      {activeTab === 'website' && (
        <div style={styles.websiteImportArea}>
          <textarea
            value={websiteContent}
            onChange={(e) => setWebsiteContent(e.target.value)}
            placeholder="Paste the recipe text from a website here... (you can include the URL)"
            style={{...styles.textarea, minHeight: 200, marginBottom: 16}}
          />
          <button
            onClick={handleWebsiteImport}
            disabled={isProcessing}
            style={styles.importBtn}
          >
            {isProcessing ? 'Processing...' : 'Extract Recipe'}
          </button>
        </div>
      )}

      {/* Manual Form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSubmit} style={styles.form} className="form-container">
          {/* Basic Info */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Basic Information</h3>
            
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Recipe Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Grandma's Apple Pie"
                style={styles.input}
                required
              />
            </div>

            <div style={{...styles.gridRow, marginBottom: 20}} className="grid-row">
              <div>
                <label style={styles.fieldLabel}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select...</option>
                  {DEFAULT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.fieldLabel}>Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  placeholder="e.g., Grandma"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.fieldLabel}>Source</label>
                <select
                  value={formData.authorIsFamily ? 'family' : 'external'}
                  onChange={(e) => updateField('authorIsFamily', e.target.value === 'family')}
                  style={styles.select}
                >
                  <option value="family">Family Recipe</option>
                  <option value="external">External Source</option>
                </select>
              </div>
            </div>

            <div style={{...styles.gridRow, marginBottom: 20}} className="grid-row">
              <div>
                <label style={styles.fieldLabel}>Prep Time</label>
                <input
                  type="text"
                  value={formData.prepTime}
                  onChange={(e) => updateField('prepTime', e.target.value)}
                  placeholder="e.g., 20 min"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.fieldLabel}>Cook Time</label>
                <input
                  type="text"
                  value={formData.cookTime}
                  onChange={(e) => updateField('cookTime', e.target.value)}
                  placeholder="e.g., 1 hour"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.fieldLabel}>Servings</label>
                <input
                  type="text"
                  value={formData.servings}
                  onChange={(e) => updateField('servings', e.target.value)}
                  placeholder="e.g., 8"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Source URL for external recipes */}
            {!formData.authorIsFamily && (
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Source URL</label>
                <input
                  type="url"
                  value={formData.sourceUrl || ''}
                  onChange={(e) => updateField('sourceUrl', e.target.value)}
                  placeholder="https://..."
                  style={styles.input}
                />
                <p style={styles.fieldHint}>Link to the original recipe</p>
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Ingredients</h3>
            <p style={styles.fieldHint}>Drag to reorder • New row auto-adds when typing in last row</p>
            
            {formData.ingredients.map((ing, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.ingredientRow,
                  opacity: draggedIndex === index && dragType === 'ingredient' ? 0.5 : 1,
                  borderTop: dragOverIndex === index && dragType === 'ingredient' ? '2px solid #5c6d5e' : 'none'
                }}
                className="ingredient-row"
                draggable
                onDragStart={() => handleDragStart(index, 'ingredient')}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span style={styles.dragHandle} className="drag-handle">⋮⋮</span>
                <input
                  type="text"
                  value={ing.qty || ''}
                  onChange={(e) => updateIngredient(index, 'qty', e.target.value)}
                  placeholder="Qty"
                  style={styles.qtyInput}
                  className="qty-input"
                />
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    value={ing.unit || ''}
                    onChange={(e) => {
                      updateIngredient(index, 'unit', e.target.value);
                      setUnitFilter(e.target.value);
                    }}
                    onFocus={() => {
                      setFocusedUnitIndex(index);
                      setUnitFilter(ing.unit || '');
                    }}
                    onBlur={() => setTimeout(() => setFocusedUnitIndex(null), 200)}
                    placeholder="Unit"
                    style={styles.unitInput}
                    className="unit-input"
                  />
                  {focusedUnitIndex === index && filteredUnits.length > 0 && (
                    <div style={styles.unitAutocomplete}>
                      {filteredUnits.slice(0, 6).map(unit => (
                        <button
                          key={unit}
                          type="button"
                          style={styles.unitSuggestion}
                          onMouseDown={() => {
                            updateIngredient(index, 'unit', normalizeUnit(unit));
                            setFocusedUnitIndex(null);
                          }}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={ing.ingredient || ''}
                  onChange={(e) => updateIngredient(index, 'ingredient', e.target.value)}
                  placeholder="Ingredient (e.g., flour, sifted)"
                  style={styles.ingredientInput}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  style={styles.removeBtn}
                  disabled={formData.ingredients.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button type="button" onClick={addIngredient} style={styles.addRowBtn}>
              + Add Ingredient
            </button>
          </div>

          {/* Instructions */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Instructions</h3>
            <p style={styles.fieldHint}>Drag to reorder • New step auto-adds when typing in last step</p>
            
            {formData.instructions.map((inst, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.instructionRow,
                  opacity: draggedIndex === index && dragType === 'instruction' ? 0.5 : 1,
                  borderTop: dragOverIndex === index && dragType === 'instruction' ? '2px solid #5c6d5e' : 'none'
                }}
                draggable
                onDragStart={() => handleDragStart(index, 'instruction')}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span style={styles.dragHandle} className="drag-handle">⋮⋮</span>
                <span style={styles.stepNumber}>{index + 1}</span>
                <textarea
                  value={inst}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder={`Step ${index + 1}...`}
                  style={styles.instructionTextarea}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  style={{...styles.removeBtn, marginTop: 8}}
                  disabled={formData.instructions.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button type="button" onClick={addInstruction} style={styles.addRowBtn}>
              + Add Step
            </button>
          </div>

          {/* Notes & Story */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Notes & Story</h3>
            
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Tips & Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any tips, variations, or notes about this recipe..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>The Story</label>
              <p style={styles.fieldHint}>Share the history or special memories behind this recipe</p>
              <textarea
                value={formData.story}
                onChange={(e) => updateField('story', e.target.value)}
                placeholder="Tell the story behind this recipe..."
                style={{...styles.textarea, minHeight: 150}}
              />
            </div>
          </div>

          {/* Photos */}
          <div style={styles.formSection}>
            <h3 style={styles.formSectionTitle}>Photos</h3>
            
            {/* Main Photo */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Recipe Photo</label>
              <div 
                style={styles.imageUploadArea}
                onClick={() => document.getElementById('main-image-input').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
                ) : (
                  <>
                    <div style={styles.uploadIcon}>📷</div>
                    <p style={styles.uploadText}>Click to upload photo</p>
                    <p style={styles.uploadHint}>Max 10MB</p>
                  </>
                )}
              </div>
              <input
                id="main-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, 'main')}
                style={{display: 'none'}}
              />
              {imagePreview && (
                <div style={{marginTop: 12}}>
                  <label style={styles.fieldLabel}>Photo Caption</label>
                  <input
                    type="text"
                    value={formData.imageCaption || ''}
                    onChange={(e) => updateField('imageCaption', e.target.value)}
                    placeholder="e.g., Thanksgiving 2023"
                    style={styles.input}
                  />
                </div>
              )}
            </div>

            {/* Handwritten Recipe */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Original Handwritten Recipe</label>
              <p style={styles.fieldHint}>Upload a photo of the original recipe card for preservation</p>
              <div 
                style={styles.imageUploadArea}
                onClick={() => document.getElementById('handwritten-image-input').click()}
              >
                {handwrittenImagePreview ? (
                  <img src={handwrittenImagePreview} alt="Handwritten" style={styles.imagePreview} />
                ) : (
                  <>
                    <div style={styles.uploadIcon}>📝</div>
                    <p style={styles.uploadText}>Click to upload handwritten recipe</p>
                    <p style={styles.uploadHint}>Max 10MB</p>
                  </>
                )}
              </div>
              <input
                id="handwritten-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, 'handwritten')}
                style={{display: 'none'}}
              />
              {handwrittenImagePreview && (
                <div style={{marginTop: 12}}>
                  <label style={styles.fieldLabel}>Handwritten Recipe Caption</label>
                  <input
                    type="text"
                    value={formData.handwrittenImageCaption || ''}
                    onChange={(e) => updateField('handwrittenImageCaption', e.target.value)}
                    placeholder="e.g., Grandma's original card from 1965"
                    style={styles.input}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.formActions}>
            <button type="button" onClick={handleCancel} style={styles.cancelBtn}>
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
