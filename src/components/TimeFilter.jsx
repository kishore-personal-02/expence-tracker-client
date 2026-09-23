import { useState } from 'react'

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

const getRange = (key) => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now)

  switch (key) {
    case 'today':
      return {
        startDate: todayStart.toISOString(),
        endDate: todayEnd.toISOString(),
      }

    case 'week': {
      const dayOfWeek = todayStart.getDay()
      const monday = new Date(todayStart)
      monday.setDate(todayStart.getDate() - ((dayOfWeek + 6) % 7))
      return {
        startDate: monday.toISOString(),
        endDate: todayEnd.toISOString(),
      }
    }

    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: monthStart.toISOString(),
        endDate: todayEnd.toISOString(),
      }
    }

    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return {
        startDate: yearStart.toISOString(),
        endDate: todayEnd.toISOString(),
      }
    }

    default:
      return { startDate: null, endDate: null }
  }
}

const TimeFilter = ({ onRangeChange }) => {
  const [activeRange, setActiveRange] = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const handleTabChange = (key) => {
    setActiveRange(key)
    if (key !== 'custom') {
      onRangeChange(getRange(key))
    } else {
      onRangeChange({ startDate: null, endDate: null })
    }
  }

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      onRangeChange({
        startDate: new Date(customStart).toISOString(),
        endDate: new Date(customEnd + 'T23:59:59').toISOString(),
      })
    }
  }

  return (
    <div className="time-range-tabs" role="group" aria-label="Time range">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          className={`tab-btn ${activeRange === opt.key ? 'active' : ''}`}
          onClick={() => handleTabChange(opt.key)}
          aria-pressed={activeRange === opt.key}
        >
          {opt.label}
        </button>
      ))}

      {activeRange === 'custom' && (
        <div className="date-range-inputs">
          <label htmlFor="custom-start" className="visually-hidden">Start date</label>
          <input
            id="custom-start"
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <span>to</span>
          <label htmlFor="custom-end" className="visually-hidden">End date</label>
          <input
            id="custom-end"
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={handleCustomDateChange}
            disabled={!customStart || !customEnd}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

export default TimeFilter