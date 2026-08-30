<script setup>
import { CircleHelp, Menu, Search } from 'lucide-vue-next'

defineProps({
  activePage: { type: String, required: true },
  account: { type: Object, default: null },
})

const emit = defineEmits(['toggleSidebar'])

const pageLabels = {
  Dashboard: 'Overview',
  Journal: 'Overview',
  Trades: 'All trades',
  Analytics: 'Performance',
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button
        class="icon-button menu-button"
        @click="emit('toggleSidebar')"
      >
        <Menu :size="20" />
      </button>

      <div class="breadcrumb">
        <span>{{ activePage }}</span>
        <span class="breadcrumb-separator">/</span>
        <strong>{{ pageLabels[activePage] || activePage }}</strong>
      </div>
    </div>

    <div class="topbar-right">
      <button class="icon-button">
        <Search :size="18" />
      </button>

      <button class="icon-button">
        <CircleHelp :size="18" />
      </button>

      <div class="profile">
        <div class="avatar">EA</div>

        <div class="profile-info">
          <strong>Trader</strong>
          <span>{{ account ? account.currency : 'Local workspace' }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
