<script setup>
import { ChevronRight } from 'lucide-vue-next'
import {
  cleanSymbol,
  formatMoney,
  formatPrice,
  netPnl,
  pnlClass,
  sessionForDate,
  setupForTrade,
} from '../../utils/formatters.js'

defineProps({
  trades: { type: Array, required: true },
  showViewAll: { type: Boolean, default: true },
})

const emit = defineEmits(['viewAll'])
</script>

<template>
  <section class="panel trades-panel">
    <div class="panel-header">
      <div>
        <span class="panel-eyebrow">Activity</span>
        <h2>Recent trades</h2>
      </div>

      <button
        v-if="showViewAll"
        class="text-button"
        @click="emit('viewAll')"
      >
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
        v-for="trade in trades"
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

      <p v-if="!trades.length" class="journal-text muted table-empty">
        No closed trades yet.
      </p>
    </div>
  </section>
</template>
