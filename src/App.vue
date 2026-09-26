<script setup>
import { ref, computed } from 'vue'
import { useJournal } from './composables/useJournal.js'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppTopbar from './components/layout/AppTopbar.vue'
import AccountModal from './components/modals/AccountModal.vue'
import SettingsModal from './components/modals/SettingsModal.vue'
import StateBanner from './components/shared/StateBanner.vue'
import DashboardView from './views/DashboardView.vue'
import JournalView from './views/JournalView.vue'
import TradesView from './views/TradesView.vue'
import AnalyticsView from './views/AnalyticsView.vue'

const sidebarOpen = ref(true)
const activePage = ref('Journal')
const showAccountModal = ref(false)
const showSettingsModal = ref(false)
const {
  loading,
  error,
  account,
  currentMonth,
  selectedDay,
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
  selectedDayWinRate,
  notedTrades,
  stats,
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
} = useJournal()

const monthWinRate = computed(
  () => stats.value?.currentMonth?.winRate ?? 0
)

const monthTradeCount = computed(
  () => stats.value?.currentMonth?.total ?? 0
)

function navigateTo(page) {
  activePage.value = page
}

function goToTrades() {
  activePage.value = 'Trades'
}
</script>

<template>
  <div class="app-shell">
    <div
      v-if="sidebarOpen"
      class="mobile-overlay"
      @click="sidebarOpen = false"
    ></div>

    <AppSidebar
      :sidebar-open="sidebarOpen"
      :active-page="activePage"
      :account="account"
      :loading="loading"
      @update:active-page="navigateTo"
      @close="sidebarOpen = false"
      @open-account="showAccountModal = true"
      @open-settings="showSettingsModal = true"
    />

    <main class="main-content">
      <AppTopbar
        :active-page="activePage"
        :account="account"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />

      <div class="page-content">
        <StateBanner
          v-if="error"
          :message="`Could not reach the journal API — ${error}`"
          variant="error"
        />

        <StateBanner
          v-else-if="loading"
          message="Loading journal data…"
        />

        <template v-else>
         <DashboardView
  v-if="activePage === 'Dashboard'"
  :account="account"
  :today-pnl="todayPnl"
  :today-trades="todayTrades"
  :today-win-rate="todayWinRate"
  :today-wins="todayWins"
  :today-losses="todayLosses"
  :today-longs="todayLongs"
  :today-shorts="todayShorts"

  :month-pnl="monthPnl"
  :month-trades="monthTrades"

  :month-win-rate="monthWinRate"
  :month-trade-count="monthTradeCount"

  :total-pnl="totalPnl"
  :closed-trades="closedTrades"
  :overall-win-rate="overallWinRate"
  :recent-trades="recentTrades"
  @view-all-trades="goToTrades"
/>

          <JournalView
            v-else-if="activePage === 'Journal'"
            :account="account"
            :today-pnl="todayPnl"
            :today-trades="todayTrades"
            :month-win-rate="monthWinRate"
            :month-trade-count="monthTradeCount"
            :today-win-rate="todayWinRate"
            :today-wins="todayWins"
            :today-losses="todayLosses"
            :today-longs="todayLongs"
            :today-shorts="todayShorts"
            :formatted-month="formattedMonth"
            :calendar-days="calendarDays"
            :selected-day="selectedDay"
            :current-month="currentMonth"
            :selected-day-pnl="selectedDayPnl"
            :trades-for-selected-day="tradesForSelectedDay"
            :selected-day-win-rate="selectedDayWinRate"
            :noted-trades="notedTrades"
            :recent-trades="recentTrades"
            @change-month="changeMonth"
            @select-day="selectDay"
            @view-all-trades="goToTrades"
          />

          <TradesView
            v-else-if="activePage === 'Trades'"
            :trades="sortedTrades"
          />

          <AnalyticsView
            v-else-if="activePage === 'Analytics'"
            :closed-trades="closedTrades"
            :total-pnl="totalPnl"
            :overall-win-rate="overallWinRate"
            :total-wins="totalWins"
            :total-losses="totalLosses"
            :avg-win="avgWin"
            :avg-loss="avgLoss"
            :profit-factor="profitFactor"
            :pnl-by-symbol="pnlBySymbol"
            :pnl-by-session="pnlBySession"
            :long-short-stats="longShortStats"
          />
        </template>
      </div>
    </main>

    <AccountModal
      v-if="showAccountModal"
      :account="account"
      @close="showAccountModal = false"
    />

    <SettingsModal
      v-if="showSettingsModal"
      @close="showSettingsModal = false"
    />
  </div>
</template>

<style>
@import './assets/styles/base.css';
@import './assets/styles/layout.css';
@import './assets/styles/components.css';
@import './assets/styles/modals.css';
@import './assets/styles/trades.css';
@import './assets/styles/analytics.css';
</style>
