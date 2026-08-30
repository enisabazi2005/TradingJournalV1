<script setup>
import { computed, ref } from 'vue'
import TradeCard from '../components/trades/TradeCard.vue'
import { netPnl } from '../utils/formatters.js'

const props = defineProps({
  trades: { type: Array, required: true },
})

const filter = ref('all')

const filteredTrades = computed(() => {
  if (filter.value === 'wins') {
    return props.trades.filter((t) => netPnl(t) > 0)
  }
  if (filter.value === 'losses') {
    return props.trades.filter((t) => netPnl(t) < 0)
  }
  if (filter.value === 'longs') {
    return props.trades.filter((t) => t.direction === 'BUY')
  }
  if (filter.value === 'shorts') {
    return props.trades.filter((t) => t.direction === 'SELL')
  }
  return props.trades
})

const filters = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
  { id: 'longs', label: 'Longs' },
  { id: 'shorts', label: 'Shorts' },
]
</script>

<template>
  <div>
    <section class="page-heading">
      <div>
        <span class="eyebrow">Trade history</span>
        <h1>Trades</h1>
        <p>Browse all closed trades in card view.</p>
      </div>
    </section>

    <div class="trades-toolbar">
      <span class="trades-count">
        {{ filteredTrades.length }} of {{ trades.length }} trades
      </span>

      <div class="trades-filter">
        <button
          v-for="item in filters"
          :key="item.id"
          :class="['filter-chip', { active: filter === item.id }]"
          @click="filter = item.id"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <div v-if="filteredTrades.length" class="trades-grid">
      <TradeCard
        v-for="trade in filteredTrades"
        :key="trade.id"
        :trade="trade"
      />
    </div>

    <p v-else class="journal-text muted">
      No trades match this filter.
    </p>
  </div>
</template>
