import React, { useState } from 'react';
import { styles } from '../styles/styles';

export default function Header({ 
  isFamily, 
  currentView, 
  onNavigate, 
  onFamilyLogin, 
  onLogout,
  trashedCount 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Recipes' },
    ...(isFamily ? [{ id: 'add', label: 'Add New' }] : []),
    ...(isFamily ? [{ id: 'trash', label: `Trash${trashedCount > 0 ? ` (${trashedCount})` : ''}` }] : []),
    ...(isFamily ? [{ id: 'export', label: 'Export' }] : []),
  ];

  const handleNav = (view) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        {/* Logo */}
        <button style={styles.logo} onClick={() => handleNav('home')}>
          <span style={styles.logoMark}>BF</span>
          <div style={styles.logoTextWrap}>
            <span style={styles.logoTitle}>Bever Family</span>
            <span style={styles.logoSubtitle}>R E C I P E S</span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav style={styles.nav} className="desktop-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              style={{
                ...styles.navLink,
                ...(currentView === item.id ? styles.navLinkActive : {})
              }}
              onClick={() => item.id === 'export' ? onNavigate('export') : handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
          
          {isFamily ? (
            <button style={styles.familyBtn} onClick={onLogout}>
              Logout
            </button>
          ) : (
            <button style={styles.familyBtn} onClick={onFamilyLogin}>
              Family Login
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          style={styles.mobileMenuBtn} 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav style={styles.mobileNav} className="mobile-nav open">
          {navItems.map(item => (
            <button
              key={item.id}
              style={styles.mobileNavLink}
              onClick={() => item.id === 'export' ? onNavigate('export') : handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
          
          {isFamily ? (
            <button 
              style={{...styles.mobileNavLink, color: '#9b6b5b'}} 
              onClick={() => { onLogout(); setMobileMenuOpen(false); }}
            >
              Logout
            </button>
          ) : (
            <button 
              style={{...styles.mobileNavLink, color: '#5c6d5e', fontWeight: 500}} 
              onClick={() => { onFamilyLogin(); setMobileMenuOpen(false); }}
            >
              Family Login
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
