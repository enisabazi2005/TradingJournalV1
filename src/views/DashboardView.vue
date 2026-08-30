<script setup>
import StatsGrid from '../components/journal/StatsGrid.vue'
import RecentTradesTable from '../components/journal/RecentTradesTable.vue'
import { formatMoney, pnlClass } from '../utils/formatters.js'

defineProps({
  account: { type: Object, default: null },
  todayPnl: { type: Number, required: true },
  todayTrades: { type: Array, required: true },
  todayWinRate: { type: Number, required: true },
  todayWins: { type: Number, required: true },
  todayLosses: { type: Number, required: true },
  todayLongs: { type: Number, required: true },
  todayShorts: { type: Number, required: true },
  monthPnl: { type: Number, required: true },
  monthTrades: { type: Array, required: true },
  totalPnl: { type: Number, required: true },
  closedTrades: { type: Array, required: true },
  overallWinRate: { type: Number, required: true },
  recentTrades: { type: Array, required: true },
})

const emit = defineEmits(['viewAllTrades'])
</script>

<template>
  <div>
    <section class="page-heading">
      <div>
        <span class="eyebrow">Overview</span>
        <h1>Dashboard</h1>
        <p>Your trading performance at a glance.</p>
      </div>
    </section>
<StatsGrid
  :today-pnl="todayPnl"
  :today-trades="todayTrades"
  :today-win-rate="todayWinRate"
  :today-wins="todayWins"
  :today-losses="todayLosses"
  :today-longs="todayLongs"
  :today-shorts="todayShorts"
  :account="account"
  :month-win-rate="stats.currentMonth?.winRate ?? 0"
  :month-trade-count="stats.currentMonth?.total ?? 0"
/>

    <section class="stats-grid" style="margin-top: 12px">
      <div class="stat-card">
        <div class="stat-header">
          <span>Total P/L</span>
          <span class="stat-icon">Σ</span>
        </div>

        <strong :class="['stat-value', pnlClass(totalPnl)]">
          {{ formatMoney(totalPnl) }}
        </strong>

        <span class="stat-meta">
          {{ closedTrades.length }} closed trades
        </span>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Overall win rate</span>
          <span class="stat-icon">%</span>
        </div>

        <strong class="stat-value">
          {{ overallWinRate.toFixed(1) }}%
        </strong>

        <span class="stat-meta">All-time performance</span>
      </div>

      <div class="stat-card accent">
        <div class="stat-header">
          <span>Month P/L</span>
          <span :class="['stat-icon', { positive: monthPnl > 0 }]">↗</span>
        </div>

        <strong :class="['stat-value', pnlClass(monthPnl)]">
          {{ formatMoney(monthPnl) }}
        </strong>

        <span class="stat-meta">
          {{ monthTrades.length }} trades this month
        </span>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Open positions</span>
          <span class="stat-icon">◉</span>
        </div>

        <strong class="stat-value">—</strong>
        <span class="stat-meta">From journal data</span>
      </div>
    </section>

    <RecentTradesTable
      :trades="recentTrades"
      @view-all="emit('viewAllTrades')"
    />
  </div>
</template>
