import Link from "next/link";
import styles from './Navbar.module.css'
export default function NavBar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-800">
      <a href="#" className={styles.logo}>
                <span className={styles.logoMark}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M2 16L8 8L12 12L16 6L20 10" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="20" cy="10" r="2" fill="#00FF88"/>
                  </svg>
                </span>
                <span className={styles.logoText}>Penn</span>
              </a>

      <div className="space-x-6 hidden md:block">
        <Link href="/Backtest" className="hover:text-gray-400">BackTest</Link>
        <Link href="/LiveTrading" className="hover:text-gray-400">Live Trading</Link>
        <Link href="/About" className="hover:text-gray-400">About</Link>
      </div>

      <Link href="/login">
      <button className="bg-white text-black px-4 py-2 rounded-full">
        Login
      </button>
      </Link>
    </nav>
  );
}