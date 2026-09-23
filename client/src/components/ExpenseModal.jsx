import { useEffect, useRef } from 'react'
import ExpenseForm from './ExpenseForm'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const ExpenseModal = ({ open, editing, onClose, onSubmit, submitting }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog
    const previous = document.activeElement
    const form = modalRef.current
    const focusables = form ? Array.from(form.querySelectorAll(FOCUSABLE)) : []
    const first = focusables[0]
    if (first) first.focus()
    else if (form) form.focus()

    // Basic focus trap
    const trap = (e) => {
      if (e.key !== 'Tab' || !form || !focusables.length) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', trap)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('keydown', trap)
      document.body.style.overflow = ''
      if (previous && typeof previous.focus === 'function') previous.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="expense-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" id="expense-modal-title">
            <span className="modal-title-icon">{editing ? '✏️' : '✨'}</span>
            {editing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ExpenseForm
          initialExpense={editing}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  )
}

export default ExpenseModal