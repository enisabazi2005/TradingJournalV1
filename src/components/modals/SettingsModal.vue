<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const emit = defineEmits(['close'])

const currency = ref('USD')
const showPnlSign = ref(true)
const compactView = ref(false)

function toggle(refValue) {
  refValue.value = !refValue.value
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div>
          <span class="eyebrow">Preferences</span>
          <h2>Settings</h2>
        </div>

        <button class="icon-button" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <div class="settings-group">
          <h3>Display</h3>

          <div class="setting-item">
            <label for="currency">Default currency</label>
            <select id="currency" v-model="currency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div class="setting-item">
            <label>Show +/- on P/L</label>
            <button
              :class="['toggle', { active: showPnlSign }]"
              aria-label="Toggle P/L sign"
              @click="toggle(showPnlSign)"
            ></button>
          </div>

          <div class="setting-item">
            <label>Compact trade cards</label>
            <button
              :class="['toggle', { active: compactView }]"
              aria-label="Toggle compact view"
              @click="toggle(compactView)"
            ></button>
          </div>
        </div>

        <div class="settings-group">
          <h3>Journal</h3>

          <div class="setting-item">
            <label>Auto-select today on load</label>
            <button class="toggle active" aria-label="Auto-select today"></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
