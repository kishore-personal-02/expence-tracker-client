import { useState } from 'react'
import { usePreferences } from '../context/PreferencesContext'
import { getCategoryIcon } from '../utils/expenseIcons'

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000]

const toInputDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  return new Date(dateStr).toISOString().split('T')[0]
}

const ExpenseForm = ({ initialExpense = null, onSubmit, submitting }) => {
  const { categories, upiApps } = usePreferences()
  const [type, setType] = useState(initialExpense?.type || 'expense')
  const isIncome = type === 'income'
  const [description, setDescription] = useState(initialExpense?.description || '')
  const [amount, setAmount] = useState(initialExpense ? String(initialExpense.amount) : '')
  const [category, setCategory] = useState(
    initialExpense?.category || (isIncome ? 'Income' : categories[0] || 'Food')
  )
  const [upiApp, setUpiApp] = useState(initialExpense?.upiApp || upiApps[0] || 'GPay')
  const [paymentMethod, setPaymentMethod] = useState(initialExpense?.paymentMethod || 'cash')
  const [date, setDate] = useState(toInputDate(initialExpense?.date))
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!description.trim() || !amount) {
      setError('Add a short description and the amount')
      return
    }

    if (Number(amount) <= 0) {
      setError('Amount must be greater than zero')
      return
    }

    onSubmit({
      description,
      amount: Number(amount),
      type,
      category: isIncome ? 'Income' : category,
      date,
      ...(isIncome
        ? { paymentMethod: initialExpense?.paymentMethod || 'bank' }
        : { paymentMethod, ...(paymentMethod === 'upi' ? { upiApp } : {}) }),
    })
  }

  const invalid = Boolean(error)

  return (
    <form onSubmit={handleSubmit} className="expense-form" noValidate>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {/* Amount — hero input */}
      <div className="form-group">
        <label htmlFor="amount">
          Amount<span className="field-req">*</span>
        </label>
        <div className="amount-wrap">
          <span className="amount-currency">₹</span>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            autoFocus
            aria-invalid={invalid}
          />
        </div>
        <div className="quick-amounts" aria-label="Quick amounts">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              className={`quick-amount ${Number(amount) === amt ? 'active' : ''}`}
              onClick={() => setAmount(String(amt))}
            >
              ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">
          Description<span className="field-req">*</span>
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={isIncome ? 'e.g. Salary, Refund, Interest' : 'e.g. Lunch, Groceries, Rent'}
          required
        />
      </div>

      {/* Type — expense / income */}
      <div className="form-group">
        <label id="type-label">Type</label>
        <div className="payment-toggle" role="radiogroup" aria-labelledby="type-label">
          <button
            type="button"
            role="radio"
            aria-checked={!isIncome}
            className={`payment-pill ${!isIncome ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            <span className="pm-icon">💸</span> Expense
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isIncome}
            className={`payment-pill income-pill ${isIncome ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            <span className="pm-icon">💰</span> Income
          </button>
        </div>
      </div>

      {!isIncome && (
        <>
          {/* Category — icon grid */}
          <div className="form-group">
            <label id="category-label">Category</label>
            <div className="category-grid" role="radiogroup" aria-labelledby="category-label">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="radio"
                  aria-checked={category === cat}
                  className={`category-chip ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <span className="category-chip-icon">{getCategoryIcon(cat)}</span>
                  <span className="category-chip-label">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="form-group">
            <label id="payment-label">Payment Method</label>
            <div className="payment-toggle" role="radiogroup" aria-labelledby="payment-label">
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'cash'}
                className={`payment-pill ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <span className="pm-icon">💵</span> Cash
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'upi'}
                className={`payment-pill ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <span className="pm-icon">📱</span> UPI
              </button>
            </div>
          </div>

          {paymentMethod === 'upi' && (
            <div className="form-group">
              <label id="upi-label">UPI App</label>
              <div className="upi-app-grid" role="radiogroup" aria-labelledby="upi-label">
                {upiApps.map((app) => (
                  <button
                    key={app}
                    type="button"
                    role="radio"
                    aria-checked={upiApp === app}
                    className={`upi-chip ${upiApp === app ? 'active' : ''}`}
                    onClick={() => setUpiApp(app)}
                  >
                    {app}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isIncome && (
        <div className="form-hint income-hint">
          💰 Income is recorded under the <strong>Income</strong> category and does not count toward
          your spending totals.
        </div>
      )}

      {/* Date */}
      <div className="form-group">
        <label htmlFor="date">
          Date<span className="field-req">*</span>
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            Saving…
          </>
        ) : initialExpense ? (
          <>💾 Save Changes</>
        ) : isIncome ? (
          <>💰 Add Income</>
        ) : (
          <>➕ Add Expense</>
        )}
      </button>
    </form>
  )
}

export default ExpenseForm