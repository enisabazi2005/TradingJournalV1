<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, ImageOff, Plus, X } from 'lucide-vue-next'
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

// --- Screenshot modal state ------------------------------------------------

const activeTrade = ref(null)
const activeIndex = ref(0)

const activeScreenshots = computed(() => activeTrade.value?.screenshots ?? [])
const activeScreenshot = computed(
  () => activeScreenshots.value[activeIndex.value] ?? null
)

function openScreenshots(trade) {
  if (!trade.screenshots?.length) return
  activeTrade.value = trade
  activeIndex.value = 0
}

function closeScreenshots() {
  activeTrade.value = null
  activeIndex.value = 0
}

function nextScreenshot() {
  if (!activeScreenshots.value.length) return
  activeIndex.value = (activeIndex.value + 1) % activeScreenshots.value.length
}

function prevScreenshot() {
  if (!activeScreenshots.value.length) return
  activeIndex.value =
    (activeIndex.value - 1 + activeScreenshots.value.length) %
    activeScreenshots.value.length
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function formatTimestamp(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handleKeydown(event) {
  if (!activeTrade.value) return
  if (event.key === 'Escape') closeScreenshots()
  if (event.key === 'ArrowRight') nextScreenshot()
  if (event.key === 'ArrowLeft') prevScreenshot()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
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
              <button
                v-if="trade.screenshots?.length"
                class="screenshot-button"
                @click="openScreenshots(trade)"
              >
                View screenshot
                <span v-if="trade.screenshots.length > 1" class="screenshot-count">
                  {{ trade.screenshots.length }}
                </span>
              </button>

              <span v-else class="screenshot-button disabled">
                <ImageOff :size="12" />
                No screenshot
              </span>

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

    <!-- Screenshot modal -->
    <Teleport to="body">
      <Transition name="screenshot-fade">
        <div
          v-if="activeTrade"
          class="screenshot-overlay"
          @click.self="closeScreenshots"
        >
          <div class="screenshot-modal">
            <div class="screenshot-modal-header">
              <div class="screenshot-modal-title">
                <strong>{{ cleanSymbol(activeTrade.symbol) }}</strong>

                <span
                  :class="[
                    'direction',
                    activeTrade.direction === 'BUY' ? 'buy' : 'sell',
                  ]"
                >
                  {{ activeTrade.direction }}
                </span>

                <strong :class="pnlClass(netPnl(activeTrade))">
                  {{ formatMoney(netPnl(activeTrade)) }}
                </strong>
              </div>

              <button class="screenshot-close" @click="closeScreenshots">
                <X :size="18" />
              </button>
            </div>

            <div class="screenshot-viewport">
              <button
                v-if="activeScreenshots.length > 1"
                class="screenshot-nav prev"
                @click="prevScreenshot"
              >
                <ChevronLeft :size="20" />
              </button>

              <img
                v-if="activeScreenshot"
                :key="activeScreenshot.id"
                :src="activeScreenshot.url"
                :alt="activeScreenshot.original_name"
                class="screenshot-image"
              />

              <button
                v-if="activeScreenshots.length > 1"
                class="screenshot-nav next"
                @click="nextScreenshot"
              >
                <ChevronRight :size="20" />
              </button>
            </div>

            <div class="screenshot-modal-footer">
              <span class="screenshot-meta">
                {{ activeScreenshot?.original_name }}
                <span class="meta-divider"></span>
                {{ formatBytes(activeScreenshot?.size) }}
                <span class="meta-divider"></span>
                {{ formatTimestamp(activeScreenshot?.created_at) }}
              </span>

              <span v-if="activeScreenshots.length > 1" class="screenshot-page">
                {{ activeIndex + 1 }} / {{ activeScreenshots.length }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
/* Screenshot action row */

.mini-trade-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.screenshot-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  background: var(--surface);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 600;
  transition:
    border-color 130ms ease,
    color 130ms ease,
    background 130ms ease;
}

.screenshot-button:hover {
  color: var(--gold-bright);
  border-color: var(--gold-dim);
  background: var(--gold-soft);
}

.screenshot-button.disabled {
  color: var(--text-tertiary);
  cursor: default;
  background: transparent;
}

.screenshot-button.disabled:hover {
  color: var(--text-tertiary);
  border-color: var(--border);
  background: transparent;
}

.screenshot-count {
  display: grid;
  place-items: center;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 4px;
  background: var(--gold-soft);
  color: var(--gold-bright);
  font-family: var(--font-mono);
  font-size: 8px;
}

/* Screenshot modal */

.screenshot-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(6, 7, 10, 0.72);
  backdrop-filter: blur(6px);
}

.screenshot-modal {
  width: 100%;
  max-width: 860px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow:
    0 24px 60px -12px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(201, 162, 39, 0.08);
  overflow: hidden;
}

.screenshot-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-soft);
}

.screenshot-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.screenshot-modal-title strong:first-child {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
}

.screenshot-modal-title strong {
  font-family: var(--font-mono);
  font-size: 12px;
}

.screenshot-close {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition:
    background 130ms ease,
    color 130ms ease;
}

.screenshot-close:hover {
  color: var(--text-primary);
  background: var(--surface-raised);
}

.screenshot-viewport {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  max-height: 64vh;
  padding: 20px;
  background: repeating-conic-gradient(#0d0f14 0% 25%, #101218 0% 50%) 50% / 20px 20px;
}

.screenshot-image {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 8px;
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.5);
}

.screenshot-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--text-primary);
  background: rgba(15, 17, 23, 0.8);
  border: 1px solid var(--border);
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition:
    border-color 130ms ease,
    color 130ms ease;
}

.screenshot-nav:hover {
  color: var(--gold-bright);
  border-color: var(--gold-dim);
}

.screenshot-nav.prev {
  left: 16px;
}

.screenshot-nav.next {
  right: 16px;
}

.screenshot-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 18px;
  border-top: 1px solid var(--border-soft);
}

.screenshot-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 9.5px;
}

.screenshot-page {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 9.5px;
}

/* Transition */

.screenshot-fade-enter-active,
.screenshot-fade-leave-active {
  transition: opacity 160ms ease;
}

.screenshot-fade-enter-active .screenshot-modal,
.screenshot-fade-leave-active .screenshot-modal {
  transition: transform 180ms ease, opacity 180ms ease;
}

.screenshot-fade-enter-from,
.screenshot-fade-leave-to {
  opacity: 0;
}

.screenshot-fade-enter-from .screenshot-modal,
.screenshot-fade-leave-to .screenshot-modal {
  transform: scale(0.96) translateY(6px);
  opacity: 0;
}

@media (max-width: 560px) {
  .screenshot-overlay {
    padding: 16px;
  }

  .screenshot-viewport {
    min-height: 220px;
    padding: 12px;
  }

  .screenshot-nav {
    width: 32px;
    height: 32px;
  }
}
</style>