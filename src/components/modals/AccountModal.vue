<script setup>
import { X } from 'lucide-vue-next'
import { formatMoney } from '../../utils/formatters.js'

defineProps({
  account: { type: Object, default: null },
})

const emit = defineEmits(['close'])
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div>
          <span class="eyebrow">Broker account</span>
          <h2>Account details</h2>
        </div>

        <button class="icon-button" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <template v-if="account">
          <div class="modal-row">
            <span>Broker</span>
            <strong>{{ account.broker }}</strong>
          </div>

          <div class="modal-row">
            <span>Server</span>
            <strong>{{ account.server }}</strong>
          </div>

          <div class="modal-row">
            <span>Account number</span>
            <strong>#{{ account.account_number }}</strong>
          </div>

          <div class="modal-row">
            <span>Currency</span>
            <strong>{{ account.currency }}</strong>
          </div>

          <div class="modal-row">
            <span>Balance</span>
            <strong>{{ formatMoney(account.balance, { sign: false }) }}</strong>
          </div>

          <div class="modal-row">
            <span>Equity</span>
            <strong>{{ formatMoney(account.equity, { sign: false }) }}</strong>
          </div>

          <div v-if="account.margin !== undefined" class="modal-row">
            <span>Margin</span>
            <strong>{{ formatMoney(account.margin, { sign: false }) }}</strong>
          </div>

          <div v-if="account.free_margin !== undefined" class="modal-row">
            <span>Free margin</span>
            <strong>{{ formatMoney(account.free_margin, { sign: false }) }}</strong>
          </div>
        </template>

        <p v-else class="journal-text muted">
          No account data available. Connect your MT5 backend to see account details.
        </p>
      </div>
    </div>
  </div>
</template>
