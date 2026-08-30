<script setup>
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
  trade: { type: Object, required: true },
})

const tradeDate = (trade) => {
  if (!trade.closed_at) return '—'
  return new Date(trade.closed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <article class="trade-card">
    <div class="trade-card-header">
      <div class="trade-card-symbol">
        <div class="symbol-icon">
          {{ cleanSymbol(trade.symbol).substring(0, 1) }}
        </div>

        <div>
          <strong>{{ cleanSymbol(trade.symbol) }}</strong>
          <span>{{ tradeDate(trade) }} · {{ sessionForDate(trade.opened_at) }}</span>
        </div>
      </div>

      <strong :class="['trade-card-pnl', pnlClass(netPnl(trade))]">
        {{ formatMoney(netPnl(trade)) }}
      </strong>
    </div>

    <div class="trade-card-body">
      <div class="trade-card-field">
        <span>Direction</span>
        <span
          :class="[
            'direction',
            trade.direction === 'BUY' ? 'buy' : 'sell',
          ]"
        >
          {{ trade.direction }}
        </span>
      </div>

      <div class="trade-card-field">
        <span>Volume</span>
        <strong>{{ Number(trade.volume).toFixed(2) }}</strong>
      </div>

      <div class="trade-card-field">
        <span>Entry</span>
        <strong>{{ formatPrice(trade.entry_price) }}</strong>
      </div>

      <div class="trade-card-field">
        <span>Exit</span>
        <strong>{{ formatPrice(trade.exit_price) }}</strong>
      </div>
    </div>

    <div class="trade-card-footer">
      <span class="trade-card-setup">{{ setupForTrade(trade) }}</span>
    </div>
  </article>
</template>
