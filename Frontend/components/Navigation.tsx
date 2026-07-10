'use client';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled]     = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#" className={styles.logo}>
          <span className={styles.logoMark}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M2 16L8 8L12 12L16 6L20 10" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="10" r="2" fill="#00FF88"/>
            </svg>
          </span>
          <span className={styles.logoText}>Penn</span>
        </a>

        <ul className={styles.links}>
          <a href="/" className={styles.btnGhost}>Home</a>
          <a href="/Backtest" className={styles.btnGhost}>Backtest</a>
          <a href="/About" className={styles.btnGhost}>About</a>
        </ul>


        <div className={styles.actions}>
          <a href="/login" className={styles.btnGhost}>Start Free Trial</a>
          <a href="/Profile" className={styles.btnGhost}>My Profile</a>
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <ul>
            {(['Platform', 'Strategies', 'Performance', 'Pricing', 'Docs'] as const).map(item => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}>{item}</a>
              </li>
            ))}
          </ul>
          <div className={styles.mobileActions}>
            <a href="#" className={styles.btnGhost}>Sign In</a>
            <a href="#" className={styles.btnPrimary}>Start Free Trial</a>
          </div>
        </div>
      )}
    </nav>
  );
}
