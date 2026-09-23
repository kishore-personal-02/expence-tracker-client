import { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import ExpenseList from '../components/ExpenseList'
import ExpenseModal from '../components/ExpenseModal'
import Charts from '../components/Charts'
import TimeFilter from '../components/TimeFilter'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const capitalise = (str = '') => str.charAt(0).toUpperCase() + str.slice(1)

const Dashboard = () => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [month, setMonth] = useState('')
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [chartFilter, setChartFilter] = useState(null)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      startDate: monthStart.toISOString(),
      endDate: new Date().toISOString(),
    }
  })

  const buildParams = useCallback(
    (extra = {}) => {
      const params = { ...extra }
      if (filter) params.category = filter
      if (month) params.month = month
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate
      return params
    },
    [filter, month, dateRange]
  )

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = buildParams()
      const { data } = await api.get('/expenses', { params })
      setExpenses(data.expenses)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const params = {}
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate
      const { data } = await api.get('/expenses/summary', { params })
      setSummary(data)
    } catch {
      // summary is optional
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, month, dateRange])

  const handleAdd = async (expenseData) => {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/expenses', expenseData)
      setExpenses((prev) => [data, ...prev])
      closeModal()
      fetchSummary()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (expenseData) => {
    if (!editingExpense) return
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.put(`/expenses/${editingExpense._id}`, expenseData)
      setExpenses((prev) => prev.map((e) => (e._id === data._id ? data : e)))
      closeModal()
      fetchSummary()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`)
      setExpenses((prev) => prev.filter((e) => e._id !== id))
      fetchSummary()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense')
    }
  }

  const openAddModal = () => {
    setEditingExpense(null)
    setModalOpen(true)
    setError('')
  }

  const startEdit = (expense) => {
    setEditingExpense(expense)
    setModalOpen(true)
    setError('')
  }

  const closeModal = () => {
    setEditingExpense(null)
    setModalOpen(false)
    setError('')
  }

  const handleTimeRangeChange = (range) => {
    setDateRange(range)
    setMonth('')
  }

  // --- Chart filter logic ---
  const handleChartFilter = (type, value) => {
    setChartFilter((prev) => {
      if (prev && prev.type === type && prev.value === value) {
        return null
      }
      return { type, value }
    })
  }

  const clearChartFilter = () => setChartFilter(null)

  const displayedExpenses = useMemo(() => {
    if (!chartFilter) return expenses
    return expenses.filter((e) => {
      if (chartFilter.type === 'payment') {
        return e.paymentMethod === chartFilter.value
      }
      if (chartFilter.type === 'category') {
        return e.category === chartFilter.value
      }
      return true
    })
  }, [expenses, chartFilter])

const expensesOnly = useMemo(
    () => displayedExpenses.filter((e) => e.type !== 'income'),
    [displayedExpenses]
  )

  const incomeOnly = useMemo(
    () => displayedExpenses.filter((e) => e.type === 'income'),
    [displayedExpenses]
  )

  const totalAmount = expensesOnly.reduce((sum, e) => sum + e.amount, 0)

  const totalIncome = incomeOnly.reduce((sum, e) => sum + e.amount, 0)

  const cashTotal = expensesOnly
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0)

  const upiTotal = expensesOnly
    .filter((e) => e.paymentMethod === 'upi')
    .reduce((sum, e) => sum + e.amount, 0)

  const bankTotal = expensesOnly
    .filter((e) => e.paymentMethod === 'bank')
    .reduce((sum, e) => sum + e.amount, 0)

  const PAYMENT_LABELS = { cash: 'Cash', upi: 'UPI', bank: 'Bank' }

  const filterLabel = chartFilter
    ? chartFilter.type === 'payment'
      ? PAYMENT_LABELS[chartFilter.value] || 'Bank'
      : chartFilter.value
    : null

  const greeting = user?.name
    ? `Welcome back, ${capitalise(user.name.split(' ')[0])}`
    : 'Your spending at a glance'

  return (
    <div className="dashboard">
      {/* Page header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{greeting} — here's an overview of your expenses.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add Expense
        </button>
      </header>

      {/* Summary cards */}
      <section className="dashboard-summary">
        <div className="summary-card highlight">
          <div className="summary-icon">💸</div>
          <span className="summary-label">Total Spent</span>
          <span className="summary-value">{formatCurrency(totalAmount)}</span>
          <span className="summary-count">
            {expensesOnly.length} expense{expensesOnly.length !== 1 ? 's' : ''}
            {chartFilter && ' · filtered'}
          </span>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <span className="summary-label">Income</span>
          <span className="summary-value summary-income">{formatCurrency(totalIncome)}</span>
          <span className="summary-count">
            {incomeOnly.length} entr{incomeOnly.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💵</div>
          <span className="summary-label">Cash</span>
          <span className="summary-value">{formatCurrency(cashTotal)}</span>
          <span className="summary-count">
            {expensesOnly.filter((e) => e.paymentMethod === 'cash').length} payment(s)
          </span>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📱</div>
          <span className="summary-label">UPI</span>
          <span className="summary-value">{formatCurrency(upiTotal)}</span>
          <span className="summary-count">
            {expensesOnly.filter((e) => e.paymentMethod === 'upi').length} payment(s)
          </span>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🏦</div>
          <span className="summary-label">Bank</span>
          <span className="summary-value">{formatCurrency(bankTotal)}</span>
          <span className="summary-count">
            {expensesOnly.filter((e) => e.paymentMethod === 'bank').length} payment(s)
          </span>
        </div>

        <TimeFilter onRangeChange={handleTimeRangeChange} />
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="alert-dismiss"
            onClick={() => setError('')}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Charts + list */}
      <section className="dashboard-body">
        <Charts
          summary={summary}
          activeFilter={chartFilter}
          onFilterChange={handleChartFilter}
        />

        {/* Expense list */}
        <div className="expense-list-container">
          <div className="expense-toolbar">
            <h2>
              <span>📋</span> Your Expenses
              {chartFilter && (
                <span className="toolbar-filter-badge">
                  {filterLabel}
                  <button className="badge-clear" onClick={clearChartFilter}>
                    ×
                  </button>
                </span>
              )}
            </h2>
            <div className="toolbar-filters">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by category">
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Shopping">Shopping</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="month-filter"
                aria-label="Filter by month"
              />
            </div>
          </div>
          <ExpenseList
            expenses={displayedExpenses}
            onEdit={startEdit}
            onDelete={handleDelete}
            onAdd={openAddModal}
            loading={loading}
            hasFilters={Boolean(filter || month || chartFilter)}
          />
        </div>
      </section>

      {/* Mobile add button */}
      <button className="fab" onClick={openAddModal} aria-label="Add expense">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>

      <ExpenseModal
        open={modalOpen}
        editing={editingExpense}
        onClose={closeModal}
        onSubmit={editingExpense ? handleEdit : handleAdd}
        submitting={submitting}
      />
    </div>
  )
}

export default Dashboard