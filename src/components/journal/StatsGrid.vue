<script setup>
import { formatMoney, pnlClass } from '../../utils/formatters.js'

const props = defineProps({
  todayPnl: { type: Number, required: true },
  todayTrades: { type: Array, required: true },
  todayWinRate: { type: Number, required: true },
  todayWins: { type: Number, required: true },
  todayLosses: { type: Number, required: true },
  todayLongs: { type: Number, required: true },
  todayShorts: { type: Number, required: true },

  account: { type: Object, default: null },

  accentLabel: { type: String, default: "Today's P/L" },
  accentMeta: { type: String, default: '' },

  monthWinRate: { type: Number, default: 0 },
  monthTradeCount: { type: Number, default: 0 },
})
</script>



<template>
  <section class="stats-grid">
    <div class="stat-card accent">
      <div class="stat-header">
        <span>{{ accentLabel }}</span>
        <span :class="['stat-icon', { positive: todayPnl > 0 }]">↗</span>
      </div>

      <strong :class="['stat-value', pnlClass(todayPnl)]">
        {{ formatMoney(todayPnl) }}
      </strong>

      <span class="stat-meta">
        {{ accentMeta || `${todayTrades.length} trades today` }}
      </span>
    </div>

<div class="stat-card">
  <div class="stat-header">
    <span>Win rate</span>
    <span class="stat-icon">%</span>
  </div>

  <strong class="stat-value">
    {{ monthWinRate.toFixed(1) }}%
  </strong>

  <span class="stat-meta">
    {{ monthTradeCount }} trades this month
  </span>
</div>

    <div class="stat-card">
      <div class="stat-header">
        <span>Trades</span>
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
</template>
