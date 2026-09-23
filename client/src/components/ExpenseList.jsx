import { useState } from 'react'
import { getCategoryIcon } from '../utils/expenseIcons'

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const paymentLabel = (expense) => {
  if (expense.paymentMethod === 'upi') return `📱 ${expense.upiApp || 'UPI'}`
  if (expense.paymentMethod === 'bank') return `🏦 ${expense.bankName || 'Bank'}`
  return '💵 Cash'
}

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const LoadingSkeleton = () => (
  <div className="expense-list" aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <div className="skeleton-row" key={i}>
        <div className="skeleton sk-circle" />
        <div>
          <div className="skeleton sk-line mid" />
          <div className="skeleton sk-line short" />
        </div>
        <div className="skeleton sk-bar" />
      </div>
    ))}
  </div>
)

const ExpenseList = ({ expenses, onEdit, onDelete, onAdd, loading, hasFilters }) => {
  const [confirmId, setConfirmId] = useState(null)

  const handleTrashClick = (id) => {
    if (confirmId !== id) {
      setConfirmId(id)
      setTimeout(() => {
        setConfirmId((cur) => (cur === id ? null : cur))
      }, 2500)
      return
    }
    setConfirmId(null)
    onDelete(id)
  }

  if (loading) return <LoadingSkeleton />

  if (!expenses.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{hasFilters ? '🔍' : '💸'}</div>
        <h3>{hasFilters ? 'No matching expenses' : 'No expenses yet'}</h3>
        <p>
          {hasFilters
            ? 'Try adjusting your filters or date range to find what you are looking for.'
            : 'Click "Add Expense" to record your first expense and start tracking your spending.'}
        </p>
        {!hasFilters && onAdd && (
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            + Add your first expense
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="expense-list">
      {expenses.map((expense, idx) => (
        <div
          key={expense._id}
          className={`expense-item${expense.type === 'income' ? ' income-item' : ''}`}
          style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}
        >
          <div className="expense-info">
            <div className="expense-avatar">
              {getCategoryIcon(expense.category)}
            </div>
            <div>
              <div className="expense-description" title={expense.description}>
                {expense.description}
              </div>
              <div className="expense-meta">
                <span className={`expense-category${expense.type === 'income' ? ' category-income' : ''}`}>
                  {expense.category}
                </span>
                <span className={`payment-badge ${expense.paymentMethod}`}>
                  {paymentLabel(expense)}
                </span>
                <span className="expense-date">{formatDate(expense.date)}</span>
              </div>
            </div>
          </div>
          <div className="expense-right">
            <div className={`expense-amount${expense.type === 'income' ? ' amount-income' : ''}`}>
              {expense.type === 'income' ? '+' : ''}
              {formatCurrency(expense.amount)}
            </div>
            <div className="expense-actions">
              <button
                className="icon-btn"
                onClick={() => onEdit(expense)}
                title="Edit"
                aria-label={`Edit ${expense.description}`}
              >
                <EditIcon />
              </button>
              <button
                className={`icon-btn danger ${confirmId === expense._id ? 'confirming' : ''}`}
                onClick={() => handleTrashClick(expense._id)}
                title={confirmId === expense._id ? 'Click again to confirm' : 'Delete'}
                aria-label={`Delete ${expense.description}`}
              >
                {confirmId === expense._id ? '✓' : <TrashIcon />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ExpenseList