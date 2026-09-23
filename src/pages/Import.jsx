import { useMemo, useRef, useState } from 'react'
import api from '../utils/api'
import { usePreferences } from '../context/PreferencesContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const toDateInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

const Import = () => {
  const { categories } = usePreferences()
  const fileInputRef = useRef(null)

  const [fileName, setFileName] = useState('')
  const [bankName, setBankName] = useState('')
  const [warning, setWarning] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [entries, setEntries] = useState([])

  const toEntry = (txn) => ({
    key: `${txn.date}-${txn.amount}-${Math.random().toString(36).slice(2, 8)}`,
    date: toDateInput(txn.date),
    description: txn.description,
    amount: txn.amount,
    type: txn.type === 'credit' ? 'income' : 'expense',
    category: txn.type === 'credit' ? 'Income' : 'Other',
    selected: true,
  })

  const reset = () => {
    setEntries([])
    setFileName('')
    setBankName('')
    setWarning('')
    setSuccess('')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = async (file) => {
    if (!file) return
    setError('')
    setSuccess('')
    setWarning('')
    setParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/import/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setFileName(data.fileName || file.name)
      setBankName(data.bankName || '')
      setWarning(data.warning || '')
      setEntries(data.transactions.map(toEntry))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse the PDF. Please try another file.')
      setEntries([])
    } finally {
      setParsing(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const toggleEntry = (key) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.key === key ? { ...entry, selected: !entry.selected } : entry))
    )
  }

  const updateEntry = (key, field, value) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.key === key ? { ...entry, [field]: value } : entry))
    )
  }

  const removeEntry = (key) => {
    setEntries((prev) => prev.filter((entry) => entry.key !== key))
  }

  const selectedEntries = useMemo(() => entries.filter((e) => e.selected), [entries])

  const totals = useMemo(() => {
    return selectedEntries.reduce(
      (acc, e) => {
        acc[e.type] += e.amount
        acc.count += 1
        return acc
      },
      { expense: 0, income: 0, count: 0 }
    )
  }, [selectedEntries])

  const handleImport = async () => {
    if (!selectedEntries.length) return
    setImporting(true)
    setError('')
    setSuccess('')
    try {
      const payload = selectedEntries.map(({ date, description, amount, type, category, bankName: bank }) => ({
        date,
        description,
        amount,
        type,
        category,
        bankName: bank || null,
      }))
      const { data } = await api.post('/import/expenses', { entries: payload })
      setSuccess(`Imported ${data.imported} entr${data.imported === 1 ? 'y' : 'ies'} successfully.`)
      reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import entries')
    } finally {
      setImporting(false)
    }
  }

  const categoryOptions = useMemo(() => {
    const opts = entries.some((e) => e.type === 'income')
    return opts ? ['Income', ...categories] : categories
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, categories])

  return (
    <div className="dashboard import-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Import Statement</h1>
          <p className="page-subtitle">
            Upload a bank passbook or statement PDF and we&apos;ll detect the transactions for you.
          </p>
        </div>
      </header>

      {/* Upload step */}
      {!entries.length && (
        <section className="import-upload">
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div className="dropzone-icon">🗂️</div>
            <h3>Drop your PDF here</h3>
            <p>Passbook PDFs, account statements, payment statements — any text-based PDF works.</p>
            <input
              ref={fileInputRef}
              type="file"
              id="statement-file"
              accept="application/pdf,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={parsing}>
              {parsing ? 'Parsing statement…' : '⌕  Choose a PDF file'}
            </button>
            {parsing && (
              <div className="import-progress">
                <span className="btn-spinner" aria-hidden="true" />
                Reading statement…
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button type="button" className="alert-dismiss" onClick={() => setError('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          <span>{success}</span>
        </div>
      )}

      {/* Preview step */}
      {entries.length > 0 && (
        <section className="import-preview">
          <div className="import-preview-header">
            <div className="import-file-info">
              <span className="import-file-icon">📄</span>
              <div>
                <strong>{fileName}</strong>
                <div className="import-file-meta">
                  {bankName && <span className="bank-badge">🏦 {bankName}</span>}
                  <span>{entries.length} transactions detected</span>
                </div>
              </div>
            </div>
            <div className="import-totals">
              <div className="import-total entry-expense">
                <span>Expenses</span>
                <strong>{formatCurrency(totals.expense)}</strong>
              </div>
              <div className="import-total entry-income">
                <span>Income</span>
                <strong>{formatCurrency(totals.income)}</strong>
              </div>
            </div>
          </div>

          {warning && (
            <div className="alert alert-warning" role="alert">
              <span>{warning}</span>
            </div>
          )}

          <div className="import-table-wrap">
            <table className="import-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === entries.length}
                      onChange={() => {
                        const all = selectedEntries.length === entries.length
                        setEntries((prev) => prev.map((e) => ({ ...e, selected: !all })))
                      }}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="col-amount">Amount</th>
                  <th className="col-remove" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.key} className={entry.selected ? '' : 'row-unselected'}>
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={entry.selected}
                        onChange={() => toggleEntry(entry.key)}
                        aria-label={`Include ${entry.description}`}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateEntry(entry.key, 'date', e.target.value)}
                        aria-label="Date"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) => updateEntry(entry.key, 'description', e.target.value)}
                        aria-label="Description"
                      />
                    </td>
                    <td>
                      <select
                        value={entry.category}
                        onChange={(e) => updateEntry(entry.key, 'category', e.target.value)}
                        aria-label="Category"
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={entry.type === 'income' ? 'type-income' : 'type-expense'}
                        value={entry.type}
                        onChange={(e) => {
                          const type = e.target.value
                          updateEntry(entry.key, 'type', type)
                          if (type === 'income' && entry.category !== 'Income') {
                            updateEntry(entry.key, 'category', 'Income')
                          } else if (type === 'expense' && entry.category === 'Income') {
                            updateEntry(entry.key, 'category', 'Other')
                          }
                        }}
                        aria-label="Type"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </td>
                    <td className="col-amount">
                      <span className={entry.type === 'income' ? 'amount-income' : 'amount-expense'}>
                        {entry.type === 'income' ? '+' : '−'}
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="col-remove">
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => removeEntry(entry.key)}
                        title="Remove"
                        aria-label={`Remove ${entry.description}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="import-actions">
            <button className="btn btn-ghost" onClick={reset}>
              ↺ Start over
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || !selectedEntries.length}
            >
              {importing ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Importing…
                </>
              ) : (
                <>📥 Import {selectedEntries.length} entr{selectedEntries.length === 1 ? 'y' : 'ies'}</>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default Import