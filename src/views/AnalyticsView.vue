<script setup>
import { computed } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatMoney, pnlClass } from '../utils/formatters.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

const props = defineProps({
  closedTrades: { type: Array, required: true },
  totalPnl: { type: Number, required: true },
  overallWinRate: { type: Number, required: true },
  totalWins: { type: Number, required: true },
  totalLosses: { type: Number, required: true },
  avgWin: { type: Number, required: true },
  avgLoss: { type: Number, required: true },
  profitFactor: { type: Number, required: true },
  pnlBySymbol: { type: Array, required: true },
  pnlBySession: { type: Array, required: true },
  longShortStats: { type: Object, required: true },
})

function formatProfitFactor(value) {
  if (value === Infinity) return '∞'
  if (!value) return '—'
  return value.toFixed(2)
}

function tradeLabel(trade, index) {
  return trade?.date ?? trade?.closeDate ?? trade?.exitDate ?? trade?.closedAt ?? `#${index + 1}`
}

function tooltipBase() {
  return {
    backgroundColor: 'rgba(12, 14, 20, 0.96)',
    titleColor: 'rgba(255,255,255,0.5)',
    bodyColor: '#f1f3f5',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
    displayColors: false,
  }
}

/* ---------------- Equity curve (hero) ---------------- */

const equityCurve = computed(() => {
  let running = 0
  return props.closedTrades.map((t, i) => {
    running += t?.pnl ?? 0
    return { x: i + 1, y: running, label: tradeLabel(t, i) }
  })
})

const isCurveUp = computed(() => props.totalPnl >= 0)

const equityChartData = computed(() => {
  const points = equityCurve.value
  const lineColor = isCurveUp.value ? '#34d399' : '#f87171'
  return {
    labels: points.map((p) => p.label),
    datasets: [
      {
        data: points.map((p) => p.y),
        borderColor: lineColor,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHitRadius: 12,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: 'rgba(12,14,20,0.9)',
        pointHoverBorderWidth: 2,
        tension: 0.35,
        fill: true,
        backgroundColor: (ctx) => {
          const { chart } = ctx
          const { ctx: canvasCtx, chartArea } = chart
          if (!chartArea) return null
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          if (isCurveUp.value) {
            gradient.addColorStop(0, 'rgba(52, 211, 153, 0.32)')
            gradient.addColorStop(1, 'rgba(52, 211, 153, 0)')
          } else {
            gradient.addColorStop(0, 'rgba(248, 113, 113, 0.32)')
            gradient.addColorStop(1, 'rgba(248, 113, 113, 0)')
          }
          return gradient
        },
      },
    ],
  }
})

const equityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase(),
      callbacks: {
        title: (items) => `Trade ${items[0]?.label ?? ''}`,
        label: (ctx) => `Equity: ${formatMoney(ctx.raw)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { display: false } },
    y: {
      grid: { color: 'rgba(255,255,255,0.045)', drawBorder: false },
      ticks: {
        color: 'rgba(255,255,255,0.35)',
        font: { size: 10 },
        callback: (v) => (v === 0 ? '0' : formatMoney(v)),
      },
    },
  },
}

/* ---------------- Drawdown (underwater equity) ---------------- */

const drawdownCurve = computed(() => {
  let running = 0
  let peak = 0
  return props.closedTrades.map((t, i) => {
    running += t?.pnl ?? 0
    peak = Math.max(peak, running)
    return { y: running - peak, label: tradeLabel(t, i) }
  })
})

const maxDrawdown = computed(() => {
  if (!drawdownCurve.value.length) return 0
  return Math.min(...drawdownCurve.value.map((p) => p.y))
})

const drawdownChartData = computed(() => {
  const points = drawdownCurve.value
  return {
    labels: points.map((p) => p.label),
    datasets: [{
      data: points.map((p) => p.y),
      borderColor: '#f87171',
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 10,
      pointHoverRadius: 4,
      tension: 0.25,
      fill: true,
      backgroundColor: (ctx) => {
        const { chart } = ctx
        const { ctx: canvasCtx, chartArea } = chart
        if (!chartArea) return null
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(248, 113, 113, 0)')
        gradient.addColorStop(1, 'rgba(248, 113, 113, 0.35)')
        return gradient
      },
    }],
  }
})

const drawdownChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase(),
      callbacks: {
        title: (items) => `Trade ${items[0]?.label ?? ''}`,
        label: (ctx) => `Drawdown: ${formatMoney(ctx.raw)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { display: false } },
    y: {
      grid: { color: 'rgba(255,255,255,0.045)', drawBorder: false },
      ticks: {
        color: 'rgba(255,255,255,0.35)',
        font: { size: 10 },
        callback: (v) => formatMoney(v),
      },
    },
  },
}

/* ---------------- Rolling win rate ---------------- */

const rollingWinRateCurve = computed(() => {
  let wins = 0
  return props.closedTrades.map((t, i) => {
    if ((t?.pnl ?? 0) >= 0) wins++
    return { y: (wins / (i + 1)) * 100, label: tradeLabel(t, i) }
  })
})

const winRateChartLineData = computed(() => {
  const points = rollingWinRateCurve.value
  return {
    labels: points.map((p) => p.label),
    datasets: [{
      data: points.map((p) => p.y),
      borderColor: '#f0b429',
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 10,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: true,
      backgroundColor: (ctx) => {
        const { chart } = ctx
        const { ctx: canvasCtx, chartArea } = chart
        if (!chartArea) return null
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(240, 180, 41, 0.3)')
        gradient.addColorStop(1, 'rgba(240, 180, 41, 0)')
        return gradient
      },
    }],
  }
})

const winRateLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase(),
      callbacks: {
        title: (items) => `Trade ${items[0]?.label ?? ''}`,
        label: (ctx) => `Win rate: ${ctx.raw.toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { display: false } },
    y: {
      min: 0,
      max: 100,
      grid: { color: 'rgba(255,255,255,0.045)', drawBorder: false },
      ticks: {
        color: 'rgba(255,255,255,0.35)',
        font: { size: 10 },
        callback: (v) => `${v}%`,
      },
    },
  },
}

/* ---------------- P&L distribution histogram ---------------- */

const pnlBuckets = computed(() => {
  const buckets = [
    { label: '< -500', min: -Infinity, max: -500, count: 0 },
    { label: '-500 to -100', min: -500, max: -100, count: 0 },
    { label: '-100 to 0', min: -100, max: 0, count: 0 },
    { label: '0 to 100', min: 0, max: 100, count: 0 },
    { label: '100 to 500', min: 100, max: 500, count: 0 },
    { label: '> 500', min: 500, max: Infinity, count: 0 },
  ]
  props.closedTrades.forEach((t) => {
    const pnl = t?.pnl ?? 0
    const bucket = buckets.find((b) => pnl >= b.min && pnl < b.max) ?? buckets[buckets.length - 1]
    bucket.count++
  })
  return buckets
})

const distributionChartData = computed(() => {
  const buckets = pnlBuckets.value
  return {
    labels: buckets.map((b) => b.label),
    datasets: [{
      data: buckets.map((b) => b.count),
      backgroundColor: buckets.map((b) =>
        b.min >= 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(248, 113, 113, 0.85)'
      ),
      hoverBackgroundColor: buckets.map((b) =>
        b.min >= 0 ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)'
      ),
      borderRadius: 7,
      borderSkipped: false,
      maxBarThickness: 46,
    }],
  }
})

const distributionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase(),
      callbacks: { label: (ctx) => `${ctx.raw} trade${ctx.raw === 1 ? '' : 's'}` },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10.5, weight: '500' } },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10 }, precision: 0 },
      grid: { color: 'rgba(255,255,255,0.045)', drawBorder: false },
    },
  },
}

/* ---------------- Best / worst trade ---------------- */

const bestTrade = computed(() => {
  if (!props.closedTrades.length) return null
  return props.closedTrades.reduce((best, t) =>
    (t?.pnl ?? -Infinity) > (best?.pnl ?? -Infinity) ? t : best
  )
})

const worstTrade = computed(() => {
  if (!props.closedTrades.length) return null
  return props.closedTrades.reduce((worst, t) =>
    (t?.pnl ?? Infinity) < (worst?.pnl ?? Infinity) ? t : worst
  )
})

/* ---------------- Profit factor radial gauge ---------------- */

const GAUGE_RADIUS = 42
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

const gaugeRatio = computed(() => {
  if (!props.profitFactor || !isFinite(props.profitFactor)) {
    return props.profitFactor === Infinity ? 1 : 0
  }
  return Math.min(props.profitFactor / 3, 1)
})

const gaugeDashoffset = computed(() => GAUGE_CIRCUMFERENCE * (1 - gaugeRatio.value))

const gaugeColor = computed(() => {
  if (!props.profitFactor) return 'rgba(255,255,255,0.25)'
  if (props.profitFactor >= 1.5) return '#f0b429'
  if (props.profitFactor >= 1) return '#34d399'
  return '#f87171'
})

/* ---------------- Symbol / session bars ---------------- */

const symbolChartData = computed(() => {
  const items = props.pnlBySymbol.slice(0, 8)
  return {
    labels: items.map((i) => i.symbol),
    datasets: [{
      data: items.map((i) => i.pnl),
      backgroundColor: items.map((i) =>
        i.pnl >= 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(248, 113, 113, 0.85)'
      ),
      hoverBackgroundColor: items.map((i) =>
        i.pnl >= 0 ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)'
      ),
      borderRadius: 7,
      borderSkipped: false,
      maxBarThickness: 26,
    }],
  }
})

const sessionChartData = computed(() => {
  return {
    labels: props.pnlBySession.map((i) => i.name),
    datasets: [{
      data: props.pnlBySession.map((i) => i.pnl),
      backgroundColor: props.pnlBySession.map((i) =>
        i.pnl >= 0 ? 'rgba(52, 211, 153, 0.85)' : 'rgba(248, 113, 113, 0.85)'
      ),
      hoverBackgroundColor: props.pnlBySession.map((i) =>
        i.pnl >= 0 ? 'rgba(52, 211, 153, 1)' : 'rgba(248, 113, 113, 1)'
      ),
      borderRadius: 7,
      borderSkipped: false,
      maxBarThickness: 26,
    }],
  }
})

const directionChartData = computed(() => {
  const longPnl = props.longShortStats.longs.pnl
  const shortPnl = props.longShortStats.shorts.pnl
  return {
    labels: ['Long', 'Short'],
    datasets: [{
      data: [Math.abs(longPnl) || 0.01, Math.abs(shortPnl) || 0.01],
      backgroundColor: [
        longPnl >= 0 ? 'rgba(52, 211, 153, 0.9)' : 'rgba(248, 113, 113, 0.9)',
        shortPnl >= 0 ? 'rgba(52, 211, 153, 0.9)' : 'rgba(248, 113, 113, 0.9)',
      ],
      hoverBackgroundColor: [
        longPnl >= 0 ? '#34d399' : '#f87171',
        shortPnl >= 0 ? '#34d399' : '#f87171',
      ],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }
})

const winRateChartData = computed(() => ({
  labels: ['Wins', 'Losses'],
  datasets: [{
    data: [props.totalWins || 0.01, props.totalLosses || 0.01],
    backgroundColor: ['rgba(52, 211, 153, 0.9)', 'rgba(248, 113, 113, 0.8)'],
    hoverBackgroundColor: ['#34d399', '#f87171'],
    borderWidth: 0,
    hoverOffset: 6,
  }],
}))

const barOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase(),
      callbacks: { label: (ctx) => formatMoney(ctx.raw) },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.045)', drawBorder: false },
      ticks: {
        color: 'rgba(255,255,255,0.4)',
        font: { size: 10 },
        callback: (v) => (v === 0 ? '0' : formatMoney(v)),
      },
    },
    y: {
      grid: { display: false },
      ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 11, weight: '500' } },
    },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '74%',
  plugins: {
    legend: { display: false },
    tooltip: tooltipBase(),
  },
}
</script>

<template>
  <div class="analytics-page">
    <section class="page-heading">
      <div>
        <span class="eyebrow">Deep dive</span>
        <h1>Analytics</h1>
        <p>Break down your performance by symbol, session, and direction.</p>
      </div>
    </section>

    <!-- HERO: equity curve -->
    <section class="hero-card">
      <div class="hero-top">
        <div>
          <span class="panel-eyebrow">Equity curve</span>
          <div class="hero-value-row">
            <strong :class="['hero-value', pnlClass(totalPnl)]">{{ formatMoney(totalPnl) }}</strong>
            <span :class="['hero-badge', pnlClass(totalPnl)]">{{ isCurveUp ? '▲' : '▼' }} cumulative</span>
          </div>
          <span class="hero-meta">{{ closedTrades.length }} closed trades</span>
        </div>
      </div>
      <div v-if="equityCurve.length" class="hero-chart-wrap">
        <Line :data="equityChartData" :options="equityChartOptions" />
      </div>
      <p v-else class="empty-state">No closed trades yet — your equity curve will appear here.</p>
    </section>

    <!-- Drawdown + rolling win rate -->
    <section class="analytics-grid">
      <div class="analytics-card">
        <div class="card-head">
          <span class="panel-eyebrow">Risk</span>
          <h3>Drawdown</h3>
        </div>
        <div v-if="drawdownCurve.length" class="chart-wrap">
          <Line :data="drawdownChartData" :options="drawdownChartOptions" />
        </div>
        <p v-else class="empty-state">No drawdown data yet.</p>
        <span class="card-footnote">Max drawdown: <strong class="loss">{{ formatMoney(maxDrawdown) }}</strong></span>
      </div>

      <div class="analytics-card">
        <div class="card-head">
          <span class="panel-eyebrow">Consistency</span>
          <h3>Rolling win rate</h3>
        </div>
        <div v-if="rollingWinRateCurve.length" class="chart-wrap">
          <Line :data="winRateChartLineData" :options="winRateLineOptions" />
        </div>
        <p v-else class="empty-state">No win-rate trend yet.</p>
        <span class="card-footnote">Current: <strong>{{ overallWinRate.toFixed(1) }}%</strong></span>
      </div>
    </section>

    <!-- KPI strip -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span>Win rate</span>
          <span class="stat-icon">%</span>
        </div>
        <strong class="stat-value">{{ overallWinRate.toFixed(1) }}%</strong>
        <span class="stat-meta">{{ totalWins }}W · {{ totalLosses }}L</span>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Avg win / loss</span>
          <span class="stat-icon">↕</span>
        </div>
        <strong class="stat-value avg-split">
          <span :class="pnlClass(avgWin)">{{ formatMoney(avgWin) }}</span>
          <span class="divider">/</span>
          <span :class="pnlClass(avgLoss)">{{ formatMoney(avgLoss) }}</span>
        </strong>
        <span class="stat-meta">Per trade average</span>
      </div>

      <div class="stat-card gauge-card">
        <div class="stat-header">
          <span>Profit factor</span>
          <span class="stat-icon">Σ</span>
        </div>
        <div class="gauge-row">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle class="gauge-track" cx="50" cy="50" r="42" />
            <circle
              class="gauge-progress"
              cx="50" cy="50" r="42"
              :style="{
                stroke: gaugeColor,
                strokeDasharray: `${GAUGE_CIRCUMFERENCE}px`,
                strokeDashoffset: `${gaugeDashoffset}px`,
              }"
            />
          </svg>
          <div class="gauge-center">
            <strong class="gauge-value">{{ formatProfitFactor(profitFactor) }}</strong>
            <span class="gauge-label">of 3.0</span>
          </div>
        </div>
        <span class="stat-meta">Gross profit / gross loss</span>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Best / worst trade</span>
          <span class="stat-icon">⚡</span>
        </div>
        <div v-if="bestTrade" class="best-worst-row">
          <div class="bw-item">
            <span class="bw-dot up"></span>
            <span class="bw-symbol">{{ bestTrade.symbol ?? '—' }}</span>
            <strong class="bw-value profit">{{ formatMoney(bestTrade.pnl ?? 0) }}</strong>
          </div>
          <div class="bw-item">
            <span class="bw-dot down"></span>
            <span class="bw-symbol">{{ worstTrade?.symbol ?? '—' }}</span>
            <strong class="bw-value loss">{{ formatMoney(worstTrade?.pnl ?? 0) }}</strong>
          </div>
        </div>
        <span v-else class="stat-meta">No trades yet</span>
      </div>
    </section>

    <section class="analytics-grid">
      <div class="analytics-card">
        <div class="card-head">
          <span class="panel-eyebrow">By symbol</span>
          <h3>P/L by instrument</h3>
        </div>
        <div v-if="pnlBySymbol.length" class="chart-wrap">
          <Bar :data="symbolChartData" :options="barOptions" />
        </div>
        <p v-else class="empty-state">No symbol data yet.</p>
      </div>

      <div class="analytics-card">
        <div class="card-head">
          <span class="panel-eyebrow">By session</span>
          <h3>P/L by market session</h3>
        </div>
        <div v-if="pnlBySession.length" class="chart-wrap">
          <Bar :data="sessionChartData" :options="barOptions" />
        </div>
        <p v-else class="empty-state">No session data yet.</p>
      </div>

      <div class="analytics-card full-width">
        <div class="card-head">
          <span class="panel-eyebrow">Distribution</span>
          <h3>Trade P/L spread</h3>
        </div>
        <div v-if="closedTrades.length" class="chart-wrap">
          <Bar :data="distributionChartData" :options="distributionChartOptions" />
        </div>
        <p v-else class="empty-state">No trades yet.</p>
      </div>

      <div class="analytics-card full-width">
        <div class="card-head">
          <span class="panel-eyebrow">Direction & edge</span>
          <h3>Long vs Short · Win / Loss distribution</h3>
        </div>

        <div class="direction-layout">
          <div class="split-stats">
            <div class="split-stat">
              <div class="split-label">
                <span class="dot long"></span>
                Long (BUY)
              </div>
              <strong :class="pnlClass(longShortStats.longs.pnl)">
                {{ formatMoney(longShortStats.longs.pnl) }}
              </strong>
              <div class="split-meta">
                <span>{{ longShortStats.longs.count }} trades</span>
                <span class="sep">·</span>
                <span>
                  {{
                    longShortStats.longs.count
                      ? ((longShortStats.longs.wins / longShortStats.longs.count) * 100).toFixed(1)
                      : 0
                  }}% win
                </span>
              </div>
            </div>

            <div class="split-stat">
              <div class="split-label">
                <span class="dot short"></span>
                Short (SELL)
              </div>
              <strong :class="pnlClass(longShortStats.shorts.pnl)">
                {{ formatMoney(longShortStats.shorts.pnl) }}
              </strong>
              <div class="split-meta">
                <span>{{ longShortStats.shorts.count }} trades</span>
                <span class="sep">·</span>
                <span>
                  {{
                    longShortStats.shorts.count
                      ? ((longShortStats.shorts.wins / longShortStats.shorts.count) * 100).toFixed(1)
                      : 0
                  }}% win
                </span>
              </div>
            </div>
          </div>

          <div class="doughnut-group">
            <div class="doughnut-item">
              <div class="doughnut-chart">
                <Doughnut :data="directionChartData" :options="doughnutOptions" />
                <div class="doughnut-center">
                  <span class="center-label">Direction</span>
                  <span class="center-value">P/L</span>
                </div>
              </div>
            </div>

            <div class="doughnut-item">
              <div class="doughnut-chart">
                <Doughnut :data="winRateChartData" :options="doughnutOptions" />
                <div class="doughnut-center">
                  <span class="center-label">Win rate</span>
                  <span class="center-value">{{ overallWinRate.toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>