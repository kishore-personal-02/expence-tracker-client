import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { usePreferences } from '../context/PreferencesContext'
import Avatar from '../components/Avatar'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatJoinDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATS = [
  { key: 'totalExpenses', label: 'Total Expenses', icon: '🧾' },
  { key: 'totalSpent', label: 'Total Spent', icon: '💸', format: (v) => formatCurrency(v) },
  { key: 'topCategory', label: 'Top Category', icon: '🏆', format: (v) => v || '—' },
]

const Profile = () => {
  const { user: authUser, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    api
      .get('/auth/profile')
      .then(({ data }) => setProfile(data))
      .catch(() => setMessage({ type: 'error', text: 'Failed to load profile' }))
      .finally(() => setLoading(false))
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // --- Update name ---
  const [name, setName] = useState(authUser?.name || '')
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (authUser) setName(authUser.name)
  }, [authUser])

  const handleNameSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    try {
      const { data } = await api.put('/auth/profile', { name })
      localStorage.setItem('user', JSON.stringify({ ...authUser, name: data.name }))
      setProfile((prev) => (prev ? { ...prev, name: data.name } : prev))
      showMessage('success', 'Name updated')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  // --- Change password ---
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    if (pw.newPassword !== pw.confirm) {
      showMessage('error', 'New passwords do not match')
      return
    }
    setSavingPw(true)
    try {
      await api.put('/auth/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      showMessage('success', 'Password changed successfully')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  // --- Delete account ---
  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmDelete.toLowerCase() !== 'delete') {
      showMessage('error', 'Type "delete" to confirm')
      return
    }
    if (!window.confirm('This will permanently delete your account and ALL expenses. Continue?')) {
      return
    }
    setDeleting(true)
    try {
      await api.delete('/auth/account')
      logout()
      navigate('/register')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to delete account')
      setDeleting(false)
    }
  }

  // --- Custom categories / UPI apps ---
  const {
    categories,
    upiApps,
    customCategories,
    customUpiApps,
    addCategory,
    removeCategory,
    addUpiApp,
    removeUpiApp,
  } = usePreferences()
  const [newCategory, setNewCategory] = useState('')
  const [newUpiApp, setNewUpiApp] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [addingUpiApp, setAddingUpiApp] = useState(false)

  const handleAddCategory = async (e) => {
    e.preventDefault()
    const clean = newCategory.trim()
    if (!clean) return
    if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      showMessage('error', `Category "${clean}" already exists`)
      return
    }
    setAddingCategory(true)
    try {
      await addCategory(clean)
      setNewCategory('')
      showMessage('success', `Added category "${clean}"`)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to add category')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleAddUpiApp = async (e) => {
    e.preventDefault()
    const clean = newUpiApp.trim()
    if (!clean) return
    if (upiApps.some((a) => a.toLowerCase() === clean.toLowerCase())) {
      showMessage('error', `UPI app "${clean}" already exists`)
      return
    }
    setAddingUpiApp(true)
    try {
      await addUpiApp(clean)
      setNewUpiApp('')
      showMessage('success', `Added UPI app "${clean}"`)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to add UPI app')
    } finally {
      setAddingUpiApp(false)
    }
  }

  const handleRemoveCategory = async (cat) => {
    try {
      await removeCategory(cat)
      showMessage('success', `Removed "${cat}"`)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to remove category')
    }
  }

  const handleRemoveUpiApp = async (app) => {
    try {
      await removeUpiApp(app)
      showMessage('success', `Removed "${app}"`)
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to remove UPI app')
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <p>Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </div>
      )}

      {/* Header card */}
      <div className="profile-header">
        <Avatar name={authUser?.name} size={84} className="profile-avatar-img" />
        <div className="profile-id">
          <h1>{profile?.name || authUser?.name}</h1>
          <p>{profile?.email || authUser?.email}</p>
          <span className="profile-since">Member since {formatJoinDate(profile?.createdAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        {STATS.map((s) => (
          <div className="stat-card" key={s.key}>
            <span className="stat-icon">{s.icon}</span>
            <div>
              <div className={`stat-value ${s.key === 'topCategory' ? 'long' : ''}`}>
                {s.format ? s.format(profile?.stats?.[s.key]) : (profile?.stats?.[s.key] ?? 0)}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="settings-section" id="settings">
        <h2>
          <span className="section-icon">⚙️</span> Account Settings
        </h2>

        {/* Edit name */}
        <div className="setting-card">
          <div className="setting-card-header">
            <span className="setting-card-icon">🏷️</span>
            <h3>Update Name</h3>
          </div>
          <form onSubmit={handleNameSave} className="setting-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
            />
            <button type="submit" className="btn btn-primary" disabled={savingName}>
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* Theme */}
        <div className="setting-card">
          <div className="setting-card-header">
            <span className="setting-card-icon">🎨</span>
            <h3>Appearance</h3>
          </div>
          <p className="setting-desc">Choose how the app looks on this device.</p>
          <div className="theme-radios">
            {[
              { value: 'system', label: '🖥️ System', desc: 'Follow device' },
              { value: 'light', label: '☀️ Light', desc: 'Light theme' },
              { value: 'dark', label: '🌙 Dark', desc: 'Dark theme' },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`theme-radio ${theme === opt.value ? 'active' : ''}`}
                onClick={() => setTheme(opt.value)}
                aria-pressed={theme === opt.value}
              >
                <span className="theme-radio-label">{opt.label}</span>
                <span className="theme-radio-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom categories */}
        <div className="setting-card">
          <div className="setting-card-header">
            <span className="setting-card-icon">📂</span>
            <h3>Custom Categories</h3>
          </div>
          <p className="setting-desc">
            Add your own categories so they appear in the Add Expense form.
          </p>
          <form onSubmit={handleAddCategory} className="setting-form">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Pets, Subscriptions"
              maxLength={24}
              aria-label="New category name"
            />
            <button type="submit" className="btn btn-primary" disabled={addingCategory}>
              {addingCategory ? 'Adding…' : 'Add'}
            </button>
          </form>
          {customCategories.length > 0 ? (
            <div className="tag-list">
              {customCategories.map((cat) => (
                <span key={cat} className="tag">
                  {cat}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveCategory(cat)}
                    aria-label={`Remove ${cat}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="setting-empty">No custom categories yet.</p>
          )}
        </div>

        {/* Custom UPI apps */}
        <div className="setting-card">
          <div className="setting-card-header">
            <span className="setting-card-icon">📱</span>
            <h3>Custom UPI Apps</h3>
          </div>
          <p className="setting-desc">
            Add your payment apps so they show up when you pay by UPI.
          </p>
          <form onSubmit={handleAddUpiApp} className="setting-form">
            <input
              type="text"
              value={newUpiApp}
              onChange={(e) => setNewUpiApp(e.target.value)}
              placeholder="e.g. Cred, Mobikwik"
              maxLength={24}
              aria-label="New UPI app name"
            />
            <button type="submit" className="btn btn-primary" disabled={addingUpiApp}>
              {addingUpiApp ? 'Adding…' : 'Add'}
            </button>
          </form>
          {customUpiApps.length > 0 ? (
            <div className="tag-list">
              {customUpiApps.map((app) => (
                <span key={app} className="tag">
                  {app}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveUpiApp(app)}
                    aria-label={`Remove ${app}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="setting-empty">No custom UPI apps yet.</p>
          )}
        </div>

        {/* Change password */}
        <div className="setting-card">
          <div className="setting-card-header">
            <span className="setting-card-icon">🔒</span>
            <h3>Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="setting-form">
            <div className="setting-form-grid">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Session */}
        <div className="setting-card">
          <div className="setting-card-header">
            <span className="setting-card-icon">🔐</span>
            <h3>Session</h3>
          </div>
          <p className="setting-desc">Signed in as {authUser?.email}. Log out to switch accounts.</p>
          <div className="setting-form">
            <button type="button" className="btn btn-ghost" onClick={logout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="setting-card danger">
          <div className="setting-card-header">
            <span className="setting-card-icon">⚠️</span>
            <h3>Danger Zone</h3>
          </div>
          <p className="setting-desc">
            Deleting your account removes all your data permanently. This cannot be undone.
          </p>
          <div className="setting-form">
            <input
              type="text"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder='Type "delete" to confirm'
              aria-label='Type "delete" to confirm'
            />
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile