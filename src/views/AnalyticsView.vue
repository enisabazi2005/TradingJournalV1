<script setup>
import { computed } from 'vue'
import { formatMoney, pnlClass } from '../utils/formatters.js'

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

const maxSymbolPnl = computed(() => {
  if (!props.pnlBySymbol.length) return 1
  return Math.max(...props.pnlBySymbol.map((s) => Math.abs(s.pnl)), 1)
})

const maxSessionPnl = computed(() => {
  if (!props.pnlBySession.length) return 1
  return Math.max(...props.pnlBySession.map((s) => Math.abs(s.pnl)), 1)
})

function barWidth(value, max) {
  return `${Math.min((Math.abs(value) / max) * 100, 100)}%`
}

function formatProfitFactor(value) {
  if (value === Infinity) return '∞'
  if (!value) return '—'
  return value.toFixed(2)
}
</script>

<template>
  <div>
    <section class="page-heading">
      <div>
        <span class="eyebrow">Deep dive</span>
        <h1>Analytics</h1>
        <p>Break down your performance by symbol, session, and direction.</p>
      </div>
    </section>

    <section class="stats-grid">
      <div class="stat-card accent">
        <div class="stat-header">
          <span>Total P/L</span>
          <span :class="['stat-icon', { positive: totalPnl > 0 }]">↗</span>
        </div>

        <strong :class="['stat-value', pnlClass(totalPnl)]">
          {{ formatMoney(totalPnl) }}
        </strong>

        <span class="stat-meta">{{ closedTrades.length }} trades analyzed</span>
      </div>

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

        <strong class="stat-value" style="font-size: 16px">
          <span :class="pnlClass(avgWin)">{{ formatMoney(avgWin) }}</span>
          /
          <span :class="pnlClass(avgLoss)">{{ formatMoney(avgLoss) }}</span>
        </strong>

        <span class="stat-meta">Per trade average</span>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span>Profit factor</span>
          <span class="stat-icon">Σ</span>
        </div>

        <strong class="stat-value">{{ formatProfitFactor(profitFactor) }}</strong>
        <span class="stat-meta">Gross profit / gross loss</span>
      </div>
    </section>

    <section class="analytics-grid" style="margin-top: 12px">
      <div class="analytics-card">
        <span class="panel-eyebrow">By symbol</span>
        <h3>P/L by instrument</h3>

        <div v-if="pnlBySymbol.length" class="bar-chart">
          <div
            v-for="item in pnlBySymbol.slice(0, 8)"
            :key="item.symbol"
            class="bar-item"
          >
            <span class="bar-label">{{ item.symbol }}</span>

            <div class="bar-track">
              <div
                :class="['bar-fill', item.pnl >= 0 ? 'positive' : 'negative']"
                :style="{ width: barWidth(item.pnl, maxSymbolPnl) }"
              ></div>
            </div>

            <span :class="['bar-value', pnlClass(item.pnl)]">
              {{ formatMoney(item.pnl) }}
            </span>
          </div>
        </div>

        <p v-else class="journal-text muted">No symbol data yet.</p>
      </div>

      <div class="analytics-card">
        <span class="panel-eyebrow">By session</span>
        <h3>P/L by market session</h3>

        <div v-if="pnlBySession.length" class="bar-chart">
          <div
            v-for="item in pnlBySession"
            :key="item.name"
            class="bar-item"
          >
            <span class="bar-label">{{ item.name }}</span>

            <div class="bar-track">
              <div
                :class="['bar-fill', item.pnl >= 0 ? 'positive' : 'negative']"
                :style="{ width: barWidth(item.pnl, maxSessionPnl) }"
              ></div>
            </div>

            <span :class="['bar-value', pnlClass(item.pnl)]">
              {{ formatMoney(item.pnl) }}
            </span>
          </div>
        </div>

        <p v-else class="journal-text muted">No session data yet.</p>
      </div>

      <div class="analytics-card full-width">
        <span class="panel-eyebrow">Direction</span>
        <h3>Long vs short performance</h3>

        <div class="split-stats">
          <div class="split-stat">
            <span>Long (BUY)</span>
            <strong :class="pnlClass(longShortStats.longs.pnl)">
              {{ formatMoney(longShortStats.longs.pnl) }}
            </strong>
            <small>
              {{ longShortStats.longs.count }} trades ·
              {{
                longShortStats.longs.count
                  ? ((longShortStats.longs.wins / longShortStats.longs.count) * 100).toFixed(1)
                  : 0
              }}% win rate
            </small>
          </div>

          <div class="split-stat">
            <span>Short (SELL)</span>
            <strong :class="pnlClass(longShortStats.shorts.pnl)">
              {{ formatMoney(longShortStats.shorts.pnl) }}
            </strong>
            <small>
              {{ longShortStats.shorts.count }} trades ·
              {{
                longShortStats.shorts.count
                  ? ((longShortStats.shorts.wins / longShortStats.shorts.count) * 100).toFixed(1)
                  : 0
              }}% win rate
            </small>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
