<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LineChart,
  Menu,
  Plus,
  Search,
  Settings,
  WalletCards,
  X,
} from 'lucide-vue-next'
import { getJournal } from '../api/journalApi.js'

const sidebarOpen = ref(true)
const activePage = ref('Journal')
const selectedDay = ref(null)

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

// --- Data loading ---------------------------------------------------------

const loading = ref(true)
const error = ref(null)
const account = ref(null)
const trades = ref([])

async function loadJournal(params = {}) {
  loading.value = true
  error.value = null

  try {
    const data = await getJournal(params)
    account.value = data.account ?? null
    trades.value = data.trades ?? []

    if (
      currentMonth.value === today.getMonth() &&
      currentYear.value === today.getFullYear()
    ) {
      selectedDay.value = today.getDate()
    }
  } catch (err) {
    error.value = err.message || 'Failed to load journal'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadJournal()
})

// --- Formatting helpers ----------------------------------------------------

function netPnl(trade) {
  const profit = Number(trade.profit) || 0
  const commission = Number(trade.commission) || 0
  const swap = Number(trade.swap) || 0
  return profit + commission + swap
}

function cleanSymbol(symbol) {
  return (symbol || '').replace(/\+$/, '')
}

function formatMoney(value, { sign = true } = {}) {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const abs = Math.abs(num).toFixed(2)
  if (!sign) return `$${abs}`
  if (num > 0) return `+$${abs}`
  if (num < 0) return `-$${abs}`
  return `$${abs}`
}

function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  const decimals = num >= 50 ? 2 : 5
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function pnlClass(value) {
  if (value > 0) return 'positive-text'
  if (value < 0) return 'negative-text'
  return 'neutral-text'
}

function sessionForDate(dateStr) {
  if (!dateStr) return '—'
  const hour = new Date(dateStr).getUTCHours()
  if (hour >= 0 && hour < 7) return 'Sydney/Tokyo'
  if (hour >= 7 && hour < 13) return 'London'
  if (hour >= 13 && hour < 21) return 'New York'
  return 'After hours'
}

function setupForTrade(trade) {
  if (Array.isArray(trade.tags) && trade.tags.length) {
    return trade.tags
      .map((tag) => (typeof tag === 'string' ? tag : tag.name))
      .filter(Boolean)
      .join(', ')
  }
  return trade.comment || 'Manual'
}

function isSameDay(dateStr, day, month, year) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return (
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === day
  )
}

// --- Derived data ------------------------------------------------------

const closedTrades = computed(() =>
  trades.value.filter((t) => t.status === 'CLOSED' && t.closed_at)
)

const sortedTrades = computed(() =>
  [...closedTrades.value].sort(
    (a, b) => new Date(b.closed_at) - new Date(a.closed_at)
  )
)

const recentTrades = computed(() => sortedTrades.value.slice(0, 6))

const todayTrades = computed(() =>
  closedTrades.value.filter((t) =>
    isSameDay(t.closed_at, today.getDate(), today.getMonth(), today.getFullYear())
  )
)

const todayPnl = computed(() =>
  todayTrades.value.reduce((sum, t) => sum + netPnl(t), 0)
)

const todayWins = computed(
  () => todayTrades.value.filter((t) => netPnl(t) > 0).length
)

const todayLosses = computed(
  () => todayTrades.value.length - todayWins.value
)

const todayWinRate = computed(() =>
  todayTrades.value.length
    ? (todayWins.value / todayTrades.value.length) * 100
    : 0
)

const todayLongs = computed(
  () => todayTrades.value.filter((t) => t.direction === 'BUY').length
)

const todayShorts = computed(
  () => todayTrades.value.filter((t) => t.direction === 'SELL').length
)

const monthTrades = computed(() =>
  closedTrades.value.filter((t) => {
    const d = new Date(t.closed_at)
    return (
      d.getFullYear() === currentYear.value &&
      d.getMonth() === currentMonth.value
    )
  })
)

const monthPnl = computed(() =>
  monthTrades.value.reduce((sum, t) => sum + netPnl(t), 0)
)

const formattedMonth = computed(
  () => `${monthNames[currentMonth.value]} ${currentYear.value}`
)

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []

  for (let i = firstWeekday; i > 0; i--) {
    cells.push({ day: prevMonthDays - i + 1, month: 'filler' })
  }

  const byDay = {}
  for (const t of monthTrades.value) {
    const dayNum = new Date(t.closed_at).getDate()
    if (!byDay[dayNum]) byDay[dayNum] = { pnl: 0, trades: 0 }
    byDay[dayNum].pnl += netPnl(t)
    byDay[dayNum].trades += 1
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(byDay[d] ? { day: d, ...byDay[d] } : { day: d })
  }

  const remainder = cells.length % 7
  const trailing = remainder === 0 ? 0 : 7 - remainder
  for (let i = 1; i <= trailing; i++) {
    cells.push({ day: i, month: 'filler' })
  }

  return cells
})

const tradesForSelectedDay = computed(() => {
  if (!selectedDay.value) return []
  return closedTrades.value.filter((t) =>
    isSameDay(
      t.closed_at,
      selectedDay.value,
      currentMonth.value,
      currentYear.value
    )
  )
})

const selectedDayPnl = computed(() =>
  tradesForSelectedDay.value.reduce((sum, t) => sum + netPnl(t), 0)
)

const selectedDayWins = computed(
  () => tradesForSelectedDay.value.filter((t) => netPnl(t) > 0).length
)

const selectedDayWinRate = computed(() =>
  tradesForSelectedDay.value.length
    ? (selectedDayWins.value / tradesForSelectedDay.value.length) * 100
    : 0
)

const notedTrades = computed(() =>
  tradesForSelectedDay.value.filter((t) => t.journal)
)

function selectDay(day) {
  if (day.month) return
  selectedDay.value = day.day
}

function changeMonth(amount) {
  currentMonth.value += amount

  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  }

  if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }

  selectedDay.value = null
}
</script>

<template>
  <div class="app-shell">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="mobile-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside :class="['sidebar', { collapsed: !sidebarOpen }]">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-mark">
            <LineChart :size="17" :stroke-width="2" />
          </div>

          <div v-if="sidebarOpen" class="brand-text">
            <span class="brand-name">TradeJournal</span>
            <span class="brand-version">Ledger&nbsp;I</span>
          </div>
        </div>

        <button
          v-if="sidebarOpen"
          class="icon-button sidebar-close"
          @click="sidebarOpen = false"
        >
          <X :size="17" />
        </button>
      </div>

      <div v-if="sidebarOpen" class="workspace-label">
        Workspace
      </div>

      <nav class="navigation">
        <button
          v-for="item in [
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Journal', icon: BookOpen },
            { label: 'Calendar', icon: CalendarDays },
            { label: 'Trades', icon: BarChart3 },
            { label: 'Analytics', icon: LineChart },
          ]"
          :key="item.label"
          :class="['nav-item', { active: activePage === item.label }]"
          @click="activePage = item.label"
        >
          <component :is="item.icon" :size="18" :stroke-width="1.7" />
          <span v-if="sidebarOpen">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-bottom">
        <button class="nav-item">
          <WalletCards :size="18" :stroke-width="1.7" />
          <span v-if="sidebarOpen">Account</span>
        </button>

        <button class="nav-item">
          <Settings :size="18" :stroke-width="1.7" />
          <span v-if="sidebarOpen">Settings</span>
        </button>

        <div v-if="sidebarOpen" class="connection-card">
          <div class="connection-status">
            <span :class="['status-dot', { live: account }]"></span>
            <span>{{ account ? account.broker : 'MT5 connection' }}</span>
          </div>

          <span class="connection-text">
            {{
              account
                ? `${account.server} · #${account.account_number}`
                : loading
                  ? 'Connecting…'
                  : 'Waiting for backend'
            }}
          </span>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main-content">
      <!-- Top bar -->
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="icon-button menu-button"
            @click="sidebarOpen = !sidebarOpen"
          >
            <Menu :size="20" />
          </button>

          <div class="breadcrumb">
            <span>Journal</span>
            <span class="breadcrumb-separator">/</span>
            <strong>Overview</strong>
          </div>
        </div>

        <div class="topbar-right">
          <button class="icon-button">
            <Search :size="18" />
          </button>

          <button class="icon-button">
            <CircleHelp :size="18" />
          </button>

          <div class="profile">
            <div class="avatar">EA</div>

            <div class="profile-info">
              <strong>Trader</strong>
              <span>{{ account ? account.currency : 'Local workspace' }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Page -->
      <div class="page-content">
        <section class="page-heading">
          <div>
            <span class="eyebrow">Trading journal</span>
            <h1>Journal</h1>
            <p>
              Review your trading activity, performance and thoughts.
            </p>
          </div>

          <button class="primary-button">
            <Plus :size="16" />
            New entry
          </button>
        </section>

        <!-- Loading / error states -->
        <div v-if="error" class="state-banner error">
          Could not reach the journal API — {{ error }}
        </div>

        <div v-else-if="loading" class="state-banner">
          Loading journal data…
        </div>

        <template v-else>
          <!-- Stats -->
          <section class="stats-grid">
            <div class="stat-card accent">
              <div class="stat-header">
                <span>Today's P/L</span>
                <span :class="['stat-icon', { positive: todayPnl > 0 }]">↗</span>
              </div>

              <strong :class="['stat-value', pnlClass(todayPnl)]">
                {{ formatMoney(todayPnl) }}
              </strong>

              <span class="stat-meta">
                {{ todayTrades.length }} trades today
              </span>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span>Win rate</span>
                <span class="stat-icon">%</span>
              </div>

              <strong class="stat-value">
                {{ todayWinRate.toFixed(1) }}%
              </strong>

              <span class="stat-meta">
                {{ todayWins }} wins · {{ todayLosses }} losses
              </span>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span>Trades today</span>
                <span class="stat-icon">↕</span>
              </div>

              <strong class="stat-value">
                {{ todayTrades.length }}
              </strong>

              <span class="stat-meta">
                {{ todayLongs }} long · {{ todayShorts }} short
              </span>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <span>Account balance</span>
                <span class="stat-icon">◉</span>
              </div>

              <strong class="stat-value">
                {{ account ? formatMoney(account.balance, { sign: false }) : '—' }}
              </strong>

              <span class="stat-meta">
                {{ account ? `Equity ${formatMoney(account.equity, { sign: false })}` : '—' }}
              </span>
            </div>
          </section>

          <!-- Calendar + Daily journal -->
          <section class="main-grid">
            <div class="panel calendar-panel">
              <div class="panel-header">
                <div>
                  <span class="panel-eyebrow">Performance</span>
                  <h2>Trading calendar</h2>
                </div>

                <div class="calendar-controls">
                  <button
                    class="month-button"
                    @click="changeMonth(-1)"
                  >
                    <ChevronLeft :size="16" />
                  </button>

                  <span class="month-title">
                    {{ formattedMonth }}
                  </span>

                  <button
                    class="month-button"
                    @click="changeMonth(1)"
                  >
                    <ChevronRight :size="16" />
                  </button>
                </div>
              </div>

              <div class="calendar">
                <div
                  v-for="weekday in ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']"
                  :key="weekday"
                  class="weekday"
                >
                  {{ weekday }}
                </div>

                <button
                  v-for="(day, index) in calendarDays"
                  :key="`${day.day}-${index}`"
                  :class="[
                    'calendar-day',
                    {
                      muted: day.month,
                      selected: selectedDay === day.day && !day.month,
                      profitable: day.pnl > 0,
                      losing: day.pnl < 0,
                    },
                  ]"
                  @click="selectDay(day)"
                >
                  <span class="day-number">{{ day.day }}</span>

                  <template v-if="day.pnl !== undefined">
                    <span :class="['day-pnl', pnlClass(day.pnl)]">
                      {{ formatMoney(day.pnl) }}
                    </span>

                    <span class="day-trades">
                      {{ day.trades }} trades
                    </span>
                  </template>
                </button>
              </div>

              <div class="calendar-footer">
                <div class="legend">
                  <span class="legend-item">
                    <span class="legend-dot positive-dot"></span>
                    Profitable
                  </span>

                  <span class="legend-item">
                    <span class="legend-dot negative-dot"></span>
                    Losing
                  </span>

                  <span class="legend-item">
                    <span class="legend-dot neutral-dot"></span>
                    No trades
                  </span>
                </div>
              </div>
            </div>

            <!-- Daily journal -->
            <div class="panel daily-panel">
              <div class="panel-header">
                <div>
                  <span class="panel-eyebrow">Daily journal</span>
                  <h2>
                    {{
                      selectedDay
                        ? `${monthNames[currentMonth]} ${selectedDay}`
                        : 'Select a day'
                    }}
                  </h2>
                </div>

                <button class="icon-button">
                  <Plus :size="16" />
                </button>
              </div>

              <div v-if="selectedDay" class="daily-content">
                <div class="daily-result">
                  <span>Daily result</span>

                  <strong :class="pnlClass(selectedDayPnl)">
                    {{ formatMoney(selectedDayPnl) }}
                  </strong>
                </div>

                <div class="daily-meta">
                  <span>
                    {{ tradesForSelectedDay.length }} trades
                  </span>

                  <span class="meta-divider"></span>

                  <span>
                    {{ selectedDayWinRate.toFixed(1) }}% win rate
                  </span>
                </div>

                <div class="journal-section">
                  <div class="section-title">
                    <span>Trade notes</span>
                    <button>Edit</button>
                  </div>

                  <template v-if="notedTrades.length">
                    <p
                      v-for="trade in notedTrades"
                      :key="trade.id"
                      class="journal-text"
                    >
                      <strong>{{ cleanSymbol(trade.symbol) }}</strong> — {{ trade.journal }}
                    </p>
                  </template>

                  <p v-else class="journal-text muted">
                    No notes added for this day yet.
                  </p>
                </div>

                <div class="journal-section">
                  <div class="section-title">
                    <span>Trades</span>
                    <span class="trade-count">{{ tradesForSelectedDay.length }}</span>
                  </div>

                  <div class="mini-trades">
                    <div
                      v-for="trade in tradesForSelectedDay"
                      :key="trade.id"
                      class="mini-trade"
                    >
                      <div>
                        <strong>{{ cleanSymbol(trade.symbol) }}</strong>
                        <span>
                          {{ trade.direction }} · {{ Number(trade.volume).toFixed(2) }}
                        </span>
                      </div>

                      <strong :class="pnlClass(netPnl(trade))">
                        {{ formatMoney(netPnl(trade)) }}
                      </strong>
                    </div>

                    <p v-if="!tradesForSelectedDay.length" class="journal-text muted">
                      No trades closed on this day.
                    </p>
                  </div>
                </div>
              </div>

              <div v-else class="empty-day">
                <CalendarDays :size="26" />
                <strong>Select a trading day</strong>
                <span>
                  Choose a day from the calendar to view its journal.
                </span>
              </div>
            </div>
          </section>

          <!-- Recent trades -->
          <section class="panel trades-panel">
            <div class="panel-header">
              <div>
                <span class="panel-eyebrow">Activity</span>
                <h2>Recent trades</h2>
              </div>

              <button class="text-button">
                View all
                <ChevronRight :size="14" />
              </button>
            </div>

            <div class="trade-table">
              <div class="table-head">
                <span>Symbol</span>
                <span>Direction</span>
                <span>Entry</span>
                <span>Exit</span>
                <span>Setup</span>
                <span>P/L</span>
              </div>

              <div
                v-for="trade in recentTrades"
                :key="trade.id"
                class="table-row"
              >
                <div class="symbol-cell">
                  <div class="symbol-icon">
                    {{ cleanSymbol(trade.symbol).substring(0, 1) }}
                  </div>

                  <div>
                    <strong>{{ cleanSymbol(trade.symbol) }}</strong>
                    <span>{{ sessionForDate(trade.opened_at) }}</span>
                  </div>
                </div>

                <span
                  :class="[
                    'direction',
                    trade.direction === 'BUY' ? 'buy' : 'sell',
                  ]"
                >
                  {{ trade.direction }}
                </span>

                <span class="table-number">
                  {{ formatPrice(trade.entry_price) }}
                </span>

                <span class="table-number">
                  {{ formatPrice(trade.exit_price) }}
                </span>

                <span class="setup">
                  {{ setupForTrade(trade) }}
                </span>

                <strong :class="pnlClass(netPnl(trade))">
                  {{ formatMoney(netPnl(trade)) }}
                </strong>
              </div>

              <p v-if="!recentTrades.length" class="journal-text muted table-empty">
                No closed trades yet.
              </p>
            </div>
          </section>
        </template>
      </div>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,450;0,9..144,560;0,9..144,650;1,9..144,500&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --bg: #0a0b10;
  --surface: #12141b;
  --surface-raised: #161922;
  --border: #23262f;
  --border-soft: #1a1d25;

  --gold: #c9a227;
  --gold-bright: #e0bc47;
  --gold-dim: #7d6a2c;
  --gold-soft: rgba(201, 162, 39, 0.12);

  --text-primary: #edeef2;
  --text-secondary: #8991a0;
  --text-tertiary: #565c68;

  --profit: #5fac82;
  --profit-soft: rgba(95, 172, 130, 0.1);
  --loss: #c2695c;
  --loss-soft: rgba(194, 105, 92, 0.1);

  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;

  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg);

  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--bg);
}

button,
input,
textarea {
  font: inherit;
}

button {
  border: 0;
  font-family: var(--font-body);
}

button:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  background:
    radial-gradient(ellipse 900px 460px at 88% -12%, rgba(201, 162, 39, 0.07), transparent 60%),
    radial-gradient(ellipse 700px 500px at -5% 100%, rgba(201, 162, 39, 0.035), transparent 55%),
    var(--bg);
}

/* Sidebar */

.sidebar {
  width: 252px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-soft);
  background: #0c0e14;
  transition: width 180ms ease;
}

.sidebar.collapsed {
  width: 76px;
}

.sidebar-header {
  height: 78px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-soft);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.brand-mark {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--gold-bright);
  background: linear-gradient(155deg, #1a1d26, #14161d);
  border: 1px solid var(--gold-dim);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  white-space: nowrap;
}

.brand-name {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 560;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.brand-version {
  color: var(--gold-dim);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.workspace-label {
  padding: 26px 22px 10px;
  color: var(--text-tertiary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.navigation {
  padding: 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 2px solid transparent;
  border-radius: 0 7px 7px 0;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background 150ms ease,
    color 150ms ease,
    border-color 150ms ease;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0;
  border-left: none;
  border-radius: 8px;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.nav-item.active {
  color: var(--gold-bright);
  background: var(--gold-soft);
  border-left-color: var(--gold);
}

.sidebar.collapsed .nav-item.active {
  background: var(--gold-soft);
  box-shadow: inset 0 0 0 1px var(--gold-dim);
}

.nav-item span {
  font-size: 13px;
  font-weight: 550;
  letter-spacing: -0.005em;
}

.sidebar-bottom {
  margin-top: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.connection-card {
  margin-top: 14px;
  padding: 13px;
  border: 1px solid var(--border-soft);
  border-radius: 9px;
  background: var(--surface);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #c3c7ce;
  font-size: 11px;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
  box-shadow: 0 0 0 3px transparent;
  transition: background 200ms ease, box-shadow 200ms ease;
}

.status-dot.live {
  background: var(--gold);
  box-shadow: 0 0 0 3px var(--gold-soft);
}

.connection-text {
  display: block;
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 10px;
}

/* Main */

.main-content {
  width: calc(100% - 252px);
  margin-left: 252px;
  min-height: 100vh;
  transition:
    width 180ms ease,
    margin-left 180ms ease;
}

.sidebar.collapsed ~ .main-content {
  width: calc(100% - 76px);
  margin-left: 76px;
}

.topbar {
  height: 78px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-soft);
  background: rgba(10, 11, 16, 0.86);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 30;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
}

.topbar-left {
  gap: 18px;
}

.topbar-right {
  gap: 4px;
}

.menu-button {
  display: none !important;
}

.icon-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition:
    background 150ms ease,
    color 150ms ease;
}

.icon-button:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.breadcrumb strong {
  font-family: var(--font-display);
  font-style: italic;
  color: #c7cbd2;
  font-weight: 560;
}

.breadcrumb-separator {
  color: #2c2f38;
}

.profile {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-left: 8px;
  padding-left: 14px;
  border-left: 1px solid var(--border-soft);
}

.avatar {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--gold-bright);
  background: var(--surface-raised);
  border: 1px solid var(--gold-dim);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-info strong {
  color: #d4d7dc;
  font-size: 11px;
}

.profile-info span {
  color: var(--text-tertiary);
  font-size: 9px;
}

/* Page */

.page-content {
  width: 100%;
  max-width: 1540px;
  margin: 0 auto;
  padding: 40px 38px 60px;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 30px;
  margin-bottom: 28px;
}

.eyebrow,
.panel-eyebrow {
  display: block;
  color: var(--gold-dim);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 8px 0 6px;
  font-family: var(--font-display);
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 560;
  line-height: 1;
  letter-spacing: -0.02em;
}

.page-heading p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.primary-button {
  height: 38px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 7px;
  color: #17140a;
  background: linear-gradient(160deg, var(--gold-bright), var(--gold));
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 20px -8px rgba(201, 162, 39, 0.45);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -8px rgba(201, 162, 39, 0.6);
}

/* State banners */

.state-banner {
  padding: 16px 18px;
  margin-bottom: 12px;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 12px;
}

.state-banner.error {
  border-color: rgba(194, 105, 92, 0.35);
  background: var(--loss-soft);
  color: var(--loss);
}

/* Stats */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  position: relative;
  min-height: 128px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold-dim), transparent 75%);
  opacity: 0.55;
}

.stat-card.accent::before {
  background: linear-gradient(90deg, var(--gold-bright), var(--gold-dim) 70%, transparent);
  opacity: 1;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 10.5px;
  font-weight: 600;
}

.stat-icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: #9096a2;
  background: var(--surface-raised);
  font-size: 10px;
  font-weight: 700;
}

.stat-icon.positive {
  color: var(--profit);
  background: var(--profit-soft);
}

.stat-value {
  margin-top: 15px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  font-size: 23px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
}

.stat-meta {
  margin-top: 9px;
  color: var(--text-tertiary);
  font-size: 9.5px;
}

.positive-text {
  color: var(--profit) !important;
}

.negative-text {
  color: var(--loss) !important;
}

.neutral-text {
  color: var(--text-tertiary) !important;
}

/* Panels */

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(310px, 0.8fr);
  gap: 12px;
  margin-bottom: 12px;
}

.panel {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.panel-header {
  min-height: 78px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--border-soft);
}

.panel-header h2 {
  margin: 5px 0 0;
  font-family: var(--font-display);
  color: #e2e4e9;
  font-size: 14.5px;
  font-weight: 560;
  letter-spacing: -0.01em;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.month-button {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  background: var(--surface-raised);
  cursor: pointer;
}

.month-button:hover {
  color: var(--gold-bright);
  border-color: var(--gold-dim);
}

.month-title {
  min-width: 112px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-align: center;
}

/* Calendar */

.calendar {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.weekday {
  padding: 7px 8px;
  color: var(--gold-dim);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.calendar-day {
  position: relative;
  min-height: 76px;
  padding: 9px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid transparent;
  border-radius: 7px;
  color: #b4b9c1;
  background: var(--surface-raised);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 130ms ease,
    background 130ms ease,
    transform 130ms ease;
}

.calendar-day:hover {
  border-color: var(--border);
  transform: translateY(-1px);
}

.calendar-day.muted {
  color: #383c45;
  background: transparent;
  cursor: default;
}

.calendar-day.muted:hover {
  transform: none;
  border-color: transparent;
}

.calendar-day.selected {
  border-color: var(--gold-dim);
  box-shadow: 0 0 0 1px var(--gold-dim), 0 0 16px -4px rgba(201, 162, 39, 0.35);
}

.calendar-day.profitable {
  background:
    linear-gradient(145deg, var(--profit-soft), transparent 75%),
    var(--surface-raised);
}

.calendar-day.profitable::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 2px var(--gold-soft);
}

.calendar-day.losing {
  background:
    linear-gradient(145deg, var(--loss-soft), transparent 75%),
    var(--surface-raised);
}

.day-number {
  color: inherit;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
}

.day-pnl {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.day-trades {
  margin-top: 3px;
  color: var(--text-tertiary);
  font-size: 8px;
}

.calendar-footer {
  padding: 0 20px 16px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 9px;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.positive-dot {
  background: var(--profit);
}

.negative-dot {
  background: var(--loss);
}

.neutral-dot {
  background: #454a54;
}

/* Daily journal */

.daily-content {
  padding: 19px 20px 20px;
}

.daily-result {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.daily-result span {
  color: var(--text-tertiary);
  font-size: 10px;
}

.daily-result strong {
  font-family: var(--font-mono);
  font-size: 23px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.daily-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 9.5px;
}

.meta-divider {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #383c45;
}

.journal-section {
  margin-top: 22px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #9095a0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 11px;
  font-weight: 560;
}

.section-title button {
  padding: 0;
  color: var(--text-tertiary);
  background: transparent;
  cursor: pointer;
  font-family: var(--font-body);
  font-style: normal;
  font-size: 9px;
  font-weight: 600;
}

.section-title button:hover {
  color: var(--gold-bright);
}

.trade-count {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  color: var(--gold-bright);
  background: var(--gold-soft);
  font-family: var(--font-mono);
  font-size: 8px;
}

.journal-text {
  margin: 9px 0 0;
  color: var(--text-secondary);
  font-size: 10.5px;
  line-height: 1.7;
}

.journal-text.muted {
  color: var(--text-tertiary);
  font-style: italic;
}

.journal-text strong {
  color: #c5c9cf;
  font-family: var(--font-mono);
  font-weight: 600;
  font-style: normal;
}

.mini-trades {
  margin-top: 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mini-trade {
  min-height: 38px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--border-soft);
  border-radius: 6px;
  background: var(--surface-raised);
}

.mini-trade div {
  display: flex;
  align-items: center;
  gap: 7px;
}

.mini-trade div strong {
  color: #b6bac2;
  font-family: var(--font-mono);
  font-size: 10px;
}

.mini-trade div span {
  color: var(--text-tertiary);
  font-size: 8px;
}

.mini-trade > strong {
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.empty-day {
  min-height: 320px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #4a4f59;
}

.empty-day strong {
  color: #8b909a;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 12px;
  font-weight: 560;
}

.empty-day span {
  color: var(--text-tertiary);
  font-size: 9.5px;
  text-align: center;
  max-width: 220px;
}

/* Trades */

.trades-panel {
  margin-top: 0;
}

.text-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 9.5px;
  font-weight: 600;
}

.text-button:hover {
  color: var(--gold-bright);
}

.trade-table {
  width: 100%;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns:
    1.5fr
    0.8fr
    1fr
    1fr
    1.5fr
    0.7fr;
  align-items: center;
  column-gap: 15px;
  padding: 0 20px;
}

.table-head {
  min-height: 36px;
  color: var(--gold-dim);
  border-bottom: 1px solid var(--border-soft);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.table-row {
  min-height: 64px;
  border-bottom: 1px solid var(--border-soft);
  color: #a8adb6;
  font-size: 10px;
  transition: background 130ms ease;
}

.table-row:hover {
  background: var(--surface-raised);
}

.table-row:last-child {
  border-bottom: 0;
}

.table-empty {
  padding: 24px 20px;
}

.symbol-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.symbol-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  color: var(--gold-bright);
  background: var(--surface-raised);
  border: 1px solid var(--gold-dim);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
}

.symbol-cell div:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.symbol-cell strong {
  color: #c9ccd2;
  font-size: 10.5px;
}

.symbol-cell span {
  color: var(--text-tertiary);
  font-size: 8px;
}

.direction {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.direction.buy {
  color: var(--profit);
  background: var(--profit-soft);
}

.direction.sell {
  color: var(--loss);
  background: var(--loss-soft);
}

.table-number {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

.setup {
  color: #6c7178;
  font-size: 9px;
}

.table-row > strong {
  font-family: var(--font-mono);
  font-size: 10px;
}

/* Mobile */

.mobile-overlay {
  display: none;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .daily-panel {
    min-height: auto;
  }
}

@media (max-width: 800px) {
  .sidebar {
    transform: translateX(-100%);
    width: 252px !important;
    transition: transform 180ms ease;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: block;
    background: rgba(0, 0, 0, 0.6);
  }

  .main-content,
  .sidebar.collapsed ~ .main-content {
    width: 100%;
    margin-left: 0;
  }

  .menu-button {
    display: grid !important;
  }

  .profile-info {
    display: none;
  }

  .topbar {
    padding: 0 18px;
  }

  .page-content {
    padding: 28px 18px 50px;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .table-head,
  .table-row {
    grid-template-columns:
      1.5fr
      0.8fr
      1fr
      0.7fr;
  }

  .table-head span:nth-child(3),
  .table-head span:nth-child(4),
  .table-head span:nth-child(5),
  .table-row > .table-number:nth-of-type(1),
  .table-row > .table-number:nth-of-type(2),
  .table-row > .setup {
    display: none;
  }
}

@media (max-width: 560px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .calendar {
    padding: 7px;
    gap: 3px;
  }

  .calendar-day {
    min-height: 62px;
    padding: 6px;
  }

  .day-trades {
    display: none;
  }

  .month-title {
    min-width: 90px;
  }

  .breadcrumb {
    display: none;
  }

  .topbar-right .icon-button:first-child {
    display: none;
  }

  .table-head,
  .table-row {
    padding: 0 12px;
  }
}
</style>