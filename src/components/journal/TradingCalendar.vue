<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { formatMoney, pnlClass } from '../../utils/formatters.js'

defineProps({
  formattedMonth: { type: String, required: true },
  calendarDays: { type: Array, required: true },
  selectedDay: { type: Number, default: null },
})

const emit = defineEmits(['changeMonth', 'selectDay'])
</script>

<template>
  <div class="panel calendar-panel">
    <div class="panel-header">
      <div>
        <span class="panel-eyebrow">Performance</span>
        <h2>Trading calendar</h2>
      </div>

      <div class="calendar-controls">
        <button class="month-button" @click="emit('changeMonth', -1)">
          <ChevronLeft :size="16" />
        </button>

        <span class="month-title">{{ formattedMonth }}</span>

        <button class="month-button" @click="emit('changeMonth', 1)">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <div class="calendar">
      <div
        v-for="weekday in ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']"
        :key="weekday"
        class="weekday"
      >
        {{ weekday }}
      </div>

      <button
        v-for="(day, index) in calendarDays"
        :key="`${day.day}-${index}`"
        :class="[
          'calendar-day',
          {
            muted: day.month,
            selected: selectedDay === day.day && !day.month,
            profitable: day.pnl > 0,
            losing: day.pnl < 0,
          },
        ]"
        @click="emit('selectDay', day)"
      >
        <span class="day-number">{{ day.day }}</span>

        <template v-if="day.pnl !== undefined">
          <span :class="['day-pnl', pnlClass(day.pnl)]">
            {{ formatMoney(day.pnl) }}
          </span>

          <span class="day-trades">
            {{ day.trades }} trades
          </span>
        </template>
      </button>
    </div>

    <div class="calendar-footer">
      <div class="legend">
        <span class="legend-item">
          <span class="legend-dot positive-dot"></span>
          Profitable
        </span>

        <span class="legend-item">
          <span class="legend-dot negative-dot"></span>
          Losing
        </span>

        <span class="legend-item">
          <span class="legend-dot neutral-dot"></span>
          No trades
        </span>
      </div>
    </div>
  </div>
</template>
