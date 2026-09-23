import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from './Avatar'

const THEMES = [
  { value: 'system', icon: '🖥️', label: 'System' },
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'dark', icon: '🌙', label: 'Dark' },
]

const Navbar = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const themeMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  const handleLogout = () => {
    closeAll()
    logout()
    navigate('/login')
  }

  const closeAll = () => {
    setThemeMenuOpen(false)
    setUserMenuOpen(false)
    setDrawerOpen(false)
  }

  useEffect(() => {
    const close = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) setThemeMenuOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeAll()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0]

  const navLinkClass = ({ isActive }) =>
    `navbar-nav-link${isActive && user ? ' active' : ''}`

  const drawerItemClass = ({ isActive }) =>
    `drawer-item${isActive && user ? ' active' : ''}`

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setDrawerOpen(false)}>
          <span className="navbar-logo">₹</span> Expense Tracker
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {user && (
            <>
              <NavLink to="/" className={navLinkClass} end>
                <span className="nav-link-icon">📊</span> Dashboard
              </NavLink>
              <NavLink to="/import" className={navLinkClass}>
                <span className="nav-link-icon">📄</span> Import
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <span className="nav-link-icon">👤</span> Profile
              </NavLink>
            </>
          )}
        </div>

        <div className="navbar-right">
          {/* Theme picker */}
          <div className="theme-picker" ref={themeMenuRef}>
            <button
              className="theme-toggle"
              onClick={() => {
                setThemeMenuOpen((p) => !p)
                setUserMenuOpen(false)
              }}
              aria-label="Change theme"
              aria-haspopup="menu"
              aria-expanded={themeMenuOpen}
            >
              {currentTheme.icon}
            </button>
            {themeMenuOpen && (
              <div className="theme-dropdown" role="menu">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    className={`theme-option ${theme === t.value ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(t.value)
                      setThemeMenuOpen(false)
                    }}
                    role="menuitemradio"
                    aria-checked={theme === t.value}
                  >
                    <span className="theme-option-icon">{t.icon}</span>
                    <span className="theme-option-label">{t.label}</span>
                    {theme === t.value && <span className="theme-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-menu-btn"
                onClick={() => {
                  setUserMenuOpen((p) => !p)
                  setThemeMenuOpen(false)
                }}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <Avatar name={user.name} size={34} />
                <span className="user-menu-name">{user.name}</span>
                <span className={`user-menu-chevron ${userMenuOpen ? 'up' : ''}`}>▾</span>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-header">
                    <Avatar name={user.name} size={42} />
                    <div className="user-dropdown-id">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <Link to="/profile" className="dropdown-item" onClick={closeAll}>
                    <span className="dropdown-icon">👤</span> My Profile
                  </Link>
                  <Link to="/profile#settings" className="dropdown-item" onClick={closeAll}>
                    <span className="dropdown-icon">⚙️</span> Settings
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <span className="dropdown-icon">🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className={`hamburger ${drawerOpen ? 'active' : ''}`}
            onClick={() => setDrawerOpen((p) => !p)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile drawer — slides in from the left */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        <aside className="drawer-panel">
          <div className="drawer-header">
            <Avatar name={user?.name || 'E'} size={44} />
            <div className="drawer-id">
              {user ? (
                <>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </>
              ) : (
                <strong>Menu</strong>
              )}
            </div>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              ×
            </button>
          </div>

          <nav className="drawer-nav">
            {user ? (
              <>
                <NavLink to="/" className={drawerItemClass} end onClick={closeAll}>
                  <span className="drawer-item-icon">📊</span> Dashboard
                </NavLink>
                <NavLink to="/import" className={drawerItemClass} onClick={closeAll}>
                  <span className="drawer-item-icon">📄</span> Import
                </NavLink>
                <NavLink to="/profile" className={drawerItemClass} onClick={closeAll}>
                  <span className="drawer-item-icon">👤</span> Profile
                </NavLink>
              </>
            ) : (
              <>
                <Link to="/login" className="drawer-item" onClick={closeAll}>
                  <span className="drawer-item-icon">🔑</span> Login
                </Link>
                <Link to="/register" className="drawer-item" onClick={closeAll}>
                  <span className="drawer-item-icon">✨</span> Sign Up
                </Link>
              </>
            )}
          </nav>

          {user && (
            <>
              <div className="drawer-section-title">Settings</div>
              <nav className="drawer-nav">
                <Link to="/profile#settings" className="drawer-item" onClick={closeAll}>
                  <span className="drawer-item-icon">⚙️</span> Settings
                </Link>
              </nav>

              <div className="drawer-section-title">Theme</div>
              <div className="drawer-theme">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    className={`drawer-theme-option ${theme === t.value ? 'active' : ''}`}
                    onClick={() => setTheme(t.value)}
                  >
                    <span className="drawer-theme-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {user && (
            <div className="drawer-footer">
              <button className="btn btn-danger btn-block" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </aside>
      </div>
    </nav>
  )
}

export default Navbar