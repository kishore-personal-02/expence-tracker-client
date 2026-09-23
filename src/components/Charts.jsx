import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

const LIGHT_COLORS = [
  '#dc2626',
  '#d97706',
  '#059669',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#0d9488',
  '#64748b',
]

const DARK_COLORS = [
  '#f36a5e',
  '#f59e0b',
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
  '#2dd4bf',
  '#94a3b8',
]

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)

const makeTooltip = (tooltipBg, tooltipBorder, tooltipText) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div
        style={{
          background: tooltipBg,
          border: `1px solid ${tooltipBorder}`,
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          fontSize: 13,
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: tooltipText }}>{label}</p>
        <p style={{ margin: '4px 0 0', color: '#ef4444', fontWeight: 600 }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return CustomTooltip
}

const CHART_CURSORS = { cursor: 'pointer' }

const Charts = ({ summary, activeFilter, onFilterChange }) => {
  const [categoryChartType, setCategoryChartType] = useState('pie')
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS
  const gridColor = isDark ? '#303038' : '#fecaca'
  const tickColor = isDark ? '#6b6b76' : '#888888'
  const legendColor = isDark ? '#a1a1aa' : '#555555'
  const tooltipBg = isDark ? '#1e1e24' : '#ffffff'
  const tooltipBorder = isDark ? '#303038' : '#fecaca'
  const tooltipText = isDark ? '#f0f0f0' : '#1a1a1a'
  const areaGradientTop = isDark ? '#ef4444' : '#dc2626'
  const activeStroke = isDark ? '#f0f0f0' : '#1a1a1a'
  const fadedOpacity = 0.35

  if (!summary) return null

  const { byCategory, byPaymentMethod, byDay } = summary

  const categoryData = Object.entries(byCategory || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const PAYMENT_LABELS = { cash: 'Cash', upi: 'UPI', bank: 'Bank' }

  const paymentData = Object.entries(byPaymentMethod || {})
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: PAYMENT_LABELS[name] || name,
      value,
      key: name,
    }))

  const trendData = Object.entries(byDay || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      amount: value,
    }))

  const hasCategoryData = categoryData.length > 0
  const hasPaymentData = paymentData.length > 0
  const hasTrendData = trendData.length > 0

  const CustomTooltip = makeTooltip(tooltipBg, tooltipBorder, tooltipText)

  const handleCategoryClick = (data) => {
    if (!data?.name) return
    onFilterChange?.('category', data.name)
  }

  const handlePaymentClick = (data) => {
    if (!data?.key) return
    onFilterChange?.('payment', data.key)
  }

  const isCategoryActive = (name) =>
    activeFilter?.type === 'category' && activeFilter?.value === name

  const isPaymentActive = (key) =>
    activeFilter?.type === 'payment' && activeFilter?.value === key

  return (
    <div className="charts-section">
      {/* Category Breakdown */}
      <div className="chart-card">
        <div className="chart-title">
          <h3 style={{ margin: 0 }}>
            <span className="chart-icon">📊</span> By Category
            {activeFilter?.type === 'category' && (
              <span className="chart-active-badge">{activeFilter.value}</span>
            )}
          </h3>
          <div className="chart-type-switch">
            <button
              className={`chart-type-btn ${categoryChartType === 'pie' ? 'active' : ''}`}
              onClick={() => setCategoryChartType('pie')}
            >
              Pie
            </button>
            <button
              className={`chart-type-btn ${categoryChartType === 'bar' ? 'active' : ''}`}
              onClick={() => setCategoryChartType('bar')}
            >
              Bar
            </button>
          </div>
        </div>

        {hasCategoryData ? (
          <ResponsiveContainer width="100%" height={260}>
            {categoryChartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                  animationDuration={800}
                  animationEasing="ease-out"
                  onClick={(_, idx) => handleCategoryClick(categoryData[idx])}
                  style={CHART_CURSORS}
                >
                  {categoryData.map((item, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
                      opacity={
                        activeFilter?.type === 'category' && !isCategoryActive(item.name)
                          ? fadedOpacity
                          : 1
                      }
                      stroke={
                        isCategoryActive(item.name) ? activeStroke : 'transparent'
                      }
                      strokeWidth={isCategoryActive(item.name) ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend
                  formatter={(val) => (
                    <span style={{ color: legendColor, fontSize: 13 }}>{val}</span>
                  )}
                />
              </PieChart>
            ) : (
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ left: 20 }}
                onClick={(state) => {
                  if (state?.activePayload?.[0]) {
                    handleCategoryClick(state.activePayload[0].payload)
                  }
                }}
                style={CHART_CURSORS}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  fontSize={12}
                  tick={{ fill: tickColor }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  fontSize={12}
                  tick={{ fill: legendColor }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  animationDuration={800}
                >
                  {categoryData.map((item, idx) => (
                    <Cell
                      key={idx}
                      fill={COLORS[idx % COLORS.length]}
                      opacity={
                        activeFilter?.type === 'category' && !isCategoryActive(item.name)
                          ? fadedOpacity
                          : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">
            <span className="chart-placeholder-icon">📊</span>
            No expenses for this time range
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="chart-card">
        <h3>
          <span className="chart-icon">💳</span> By Payment Method
          {activeFilter?.type === 'payment' && (
            <span className="chart-active-badge">
              {PAYMENT_LABELS[activeFilter.value] || activeFilter.value}
            </span>
          )}
        </h3>

        {hasPaymentData ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                paddingAngle={5}
                animationDuration={800}
                animationEasing="ease-out"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                onClick={(_, idx) => handlePaymentClick(paymentData[idx])}
                style={CHART_CURSORS}
              >
                {paymentData.map((item) => (
                  <Cell
                    key={item.key}
                    fill={
                      item.key === 'cash'
                        ? isDark
                          ? '#a1a1aa'
                          : '#374151'
                        : item.key === 'upi'
                          ? isDark
                            ? '#4ade80'
                            : '#16a34a'
                          : isDark
                            ? '#f59e0b'
                            : '#d97706'
                    }
                    opacity={
                      activeFilter?.type === 'payment' && !isPaymentActive(item.key)
                        ? fadedOpacity
                        : 1
                    }
                    stroke={
                      isPaymentActive(item.key) ? activeStroke : 'transparent'
                    }
                    strokeWidth={isPaymentActive(item.key) ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(val) => formatCurrency(val)} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">
            <span className="chart-placeholder-icon">💳</span>
            No expenses for this time range
          </div>
        )}
      </div>

      {/* Daily Trend */}
      <div className="chart-card wide">
        <h3>
          <span className="chart-icon">📈</span> Daily Trend
        </h3>

        {hasTrendData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaGradientTop} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={areaGradientTop} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" fontSize={12} tick={{ fill: tickColor }} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                fontSize={12}
                tick={{ fill: tickColor }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#colorAmt)"
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">
            <span className="chart-placeholder-icon">📈</span>
            No spending in this period yet
          </div>
        )}
      </div>
    </div>
  )
}

export default Charts
