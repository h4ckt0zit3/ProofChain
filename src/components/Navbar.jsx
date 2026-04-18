import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from './WalletConnect';

export default function Navbar({ wallet, role }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/admin', label: 'Admin' },
    { path: '/issue', label: 'Issue' },
    { path: '/verify', label: 'Verify' },
    { path: '/my-certificates', label: 'My Certs' },
  ];

  const roleBadge = role === 'ADMIN' ? 'badge-admin' :
                    role === 'ISSUER' ? 'badge-issuer' : 'badge-public';

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`} id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" id="navbar-logo">
          <span className="logo-icon">⛓</span>
          <span className="logo-text">ProofChain</span>
        </Link>

        <button
          className="menu-toggle"
          id="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
        </button>

        <ul className={`nav-links ${menuOpen ? 'nav-open' : ''}`} id="nav-links">
          {navLinks.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'nav-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-right">
          {wallet.isConnected && (
            <span className={`role-badge ${roleBadge}`} id="role-badge">
              {role}
            </span>
          )}
          <WalletConnect wallet={wallet} />
        </div>
      </div>
    </nav>
  );
}
