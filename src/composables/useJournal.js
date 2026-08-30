import { computed, onMounted, ref } from 'vue'
import { getJournal } from '../api/journalApi.js'
import {
  MONTH_NAMES,
  isSameDay,
  netPnl,
} from '../utils/formatters.js'

const today = new Date()

export function useJournal() {
  const loading = ref(true)
  const error = ref(null)
  const account = ref(null)
  const trades = ref([])
  const stats = ref({
    overall: null,
    currentMonth: null,
    months: [],
  })

  const monthWinRate = computed(() => stats.value?.currentMonth?.winRate ?? 0)
const monthTradeCount = computed(() => stats.value?.currentMonth?.total ?? 0)


  const currentMonth = ref(today.getMonth())
  const currentYear = ref(today.getFullYear())
  const selectedDay = ref(null)

  async function loadJournal(params = {}) {
    loading.value = true
    error.value = null

    try {
      const data = await getJournal(params)
      console.log(data);
      account.value = data.account ?? null
      trades.value = data.trades ?? []

      stats.value = data.stats ?? {
        overall: null,
        currentMonth: null,
        months: [],
      }

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
    () => `${MONTH_NAMES[currentMonth.value]} ${currentYear.value}`
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

  const totalPnl = computed(() =>
    closedTrades.value.reduce((sum, t) => sum + netPnl(t), 0)
  )

  const totalWins = computed(
    () => closedTrades.value.filter((t) => netPnl(t) > 0).length
  )

  const totalLosses = computed(
    () => closedTrades.value.length - totalWins.value
  )

  const overallWinRate = computed(() =>
    closedTrades.value.length
      ? (totalWins.value / closedTrades.value.length) * 100
      : 0
  )

  const avgWin = computed(() => {
    const wins = closedTrades.value.filter((t) => netPnl(t) > 0)
    if (!wins.length) return 0
    return wins.reduce((sum, t) => sum + netPnl(t), 0) / wins.length
  })

  const avgLoss = computed(() => {
    const losses = closedTrades.value.filter((t) => netPnl(t) < 0)
    if (!losses.length) return 0
    return losses.reduce((sum, t) => sum + netPnl(t), 0) / losses.length
  })

  const profitFactor = computed(() => {
    const grossProfit = closedTrades.value
      .filter((t) => netPnl(t) > 0)
      .reduce((sum, t) => sum + netPnl(t), 0)
    const grossLoss = Math.abs(
      closedTrades.value
        .filter((t) => netPnl(t) < 0)
        .reduce((sum, t) => sum + netPnl(t), 0)
    )
    if (!grossLoss) return grossProfit > 0 ? Infinity : 0
    return grossProfit / grossLoss
  })

  const pnlBySymbol = computed(() => {
    const map = {}
    for (const t of closedTrades.value) {
      const sym = (t.symbol || 'Unknown').replace(/\+$/, '')
      if (!map[sym]) map[sym] = { pnl: 0, trades: 0, wins: 0 }
      const pnl = netPnl(t)
      map[sym].pnl += pnl
      map[sym].trades += 1
      if (pnl > 0) map[sym].wins += 1
    }
    return Object.entries(map)
      .map(([symbol, data]) => ({
        symbol,
        ...data,
        winRate: data.trades ? (data.wins / data.trades) * 100 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl)
  })

  const pnlBySession = computed(() => {
    const sessions = {
      'Sydney/Tokyo': { pnl: 0, trades: 0 },
      London: { pnl: 0, trades: 0 },
      'New York': { pnl: 0, trades: 0 },
      'After hours': { pnl: 0, trades: 0 },
    }

    for (const t of closedTrades.value) {
      const hour = new Date(t.opened_at).getUTCHours()
      let session = 'After hours'
      if (hour >= 0 && hour < 7) session = 'Sydney/Tokyo'
      else if (hour >= 7 && hour < 13) session = 'London'
      else if (hour >= 13 && hour < 21) session = 'New York'

      sessions[session].pnl += netPnl(t)
      sessions[session].trades += 1
    }

    return Object.entries(sessions)
      .map(([name, data]) => ({ name, ...data }))
      .filter((s) => s.trades > 0)
      .sort((a, b) => b.pnl - a.pnl)
  })

  const longShortStats = computed(() => {
    const longs = closedTrades.value.filter((t) => t.direction === 'BUY')
    const shorts = closedTrades.value.filter((t) => t.direction === 'SELL')
    return {
      longs: {
        count: longs.length,
        pnl: longs.reduce((s, t) => s + netPnl(t), 0),
        wins: longs.filter((t) => netPnl(t) > 0).length,
      },
      shorts: {
        count: shorts.length,
        pnl: shorts.reduce((s, t) => s + netPnl(t), 0),
        wins: shorts.filter((t) => netPnl(t) > 0).length,
      },
    }
  })

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

  return {
    loading,
    error,
    account,
    stats,
    trades,
    currentMonth,
    currentYear,
    selectedDay,
    loadJournal,
    closedTrades,
    sortedTrades,
    recentTrades,
    todayTrades,
    todayPnl,
    todayWins,
    todayLosses,
    todayWinRate,
    todayLongs,
    todayShorts,
    monthTrades,
    monthPnl,
    formattedMonth,
    calendarDays,
    tradesForSelectedDay,
    selectedDayPnl,
    selectedDayWins,
    selectedDayWinRate,
    notedTrades,
    totalPnl,
    totalWins,
    totalLosses,
    overallWinRate,
    avgWin,
    avgLoss,
    profitFactor,
    pnlBySymbol,
    pnlBySession,
    longShortStats,
    selectDay,
    changeMonth,
  }
}
