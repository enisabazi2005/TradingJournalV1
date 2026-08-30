<script setup>
import { Plus } from 'lucide-vue-next'
import StatsGrid from '../components/journal/StatsGrid.vue'
import TradingCalendar from '../components/journal/TradingCalendar.vue'
import DailyJournalPanel from '../components/journal/DailyJournalPanel.vue'
import RecentTradesTable from '../components/journal/RecentTradesTable.vue'

defineProps({
  account: { type: Object, default: null },
  todayPnl: { type: Number, required: true },
  todayTrades: { type: Array, required: true },
  todayWinRate: { type: Number, required: true },
  todayWins: { type: Number, required: true },
  todayLosses: { type: Number, required: true },
  todayLongs: { type: Number, required: true },
  todayShorts: { type: Number, required: true },
  formattedMonth: { type: String, required: true },
  calendarDays: { type: Array, required: true },
  selectedDay: { type: Number, default: null },
  currentMonth: { type: Number, required: true },
  selectedDayPnl: { type: Number, required: true },
  tradesForSelectedDay: { type: Array, required: true },
  selectedDayWinRate: { type: Number, required: true },
  notedTrades: { type: Array, required: true },
  recentTrades: { type: Array, required: true },
})

const emit = defineEmits(['changeMonth', 'selectDay', 'viewAllTrades'])
</script>

<template>
  <div>
    <section class="page-heading">
      <div>
        <span class="eyebrow">Trading journal</span>
        <h1>Journal</h1>
        <p>Review your trading activity, performance and thoughts.</p>
      </div>

      <button class="primary-button">
        <Plus :size="16" />
        New entry
      </button>
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
    />

    <section class="main-grid">
      <TradingCalendar
        :formatted-month="formattedMonth"
        :calendar-days="calendarDays"
        :selected-day="selectedDay"
        @change-month="emit('changeMonth', $event)"
        @select-day="emit('selectDay', $event)"
      />

      <DailyJournalPanel
        :selected-day="selectedDay"
        :current-month="currentMonth"
        :selected-day-pnl="selectedDayPnl"
        :trades-for-selected-day="tradesForSelectedDay"
        :selected-day-win-rate="selectedDayWinRate"
        :noted-trades="notedTrades"
      />
    </section>

    <RecentTradesTable
      :trades="recentTrades"
      @view-all="emit('viewAllTrades')"
    />
  </div>
</template>
