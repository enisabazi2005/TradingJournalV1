<script setup>
import { CalendarDays, Plus } from 'lucide-vue-next'
import {
  MONTH_NAMES,
  cleanSymbol,
  formatMoney,
  netPnl,
  pnlClass,
} from '../../utils/formatters.js'

defineProps({
  selectedDay: { type: Number, default: null },
  currentMonth: { type: Number, required: true },
  selectedDayPnl: { type: Number, required: true },
  tradesForSelectedDay: { type: Array, required: true },
  selectedDayWinRate: { type: Number, required: true },
  notedTrades: { type: Array, required: true },
})
</script>

<template>
  <div class="panel daily-panel">
    <div class="panel-header">
      <div>
        <span class="panel-eyebrow">Daily journal</span>
        <h2>
          {{
            selectedDay
              ? `${MONTH_NAMES[currentMonth]} ${selectedDay}`
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
        <span>{{ tradesForSelectedDay.length }} trades</span>
        <span class="meta-divider"></span>
        <span>{{ selectedDayWinRate.toFixed(1) }}% win rate</span>
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

    <div class="mini-trade-actions">
      <button class="screenshot-button">
        View screenshot
      </button>

      <strong :class="pnlClass(netPnl(trade))">
        {{ formatMoney(netPnl(trade)) }}
      </strong>
    </div>
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
      <span>Choose a day from the calendar to view its journal.</span>
    </div>
  </div>
</template>
