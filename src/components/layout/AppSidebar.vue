<script setup>
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LineChart,
  Settings,
  WalletCards,
  X,
} from 'lucide-vue-next'

defineProps({
  sidebarOpen: { type: Boolean, required: true },
  activePage: { type: String, required: true },
  account: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:activePage', 'close', 'openAccount', 'openSettings'])

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Journal', icon: BookOpen },
  { label: 'Trades', icon: BarChart3 },
  { label: 'Analytics', icon: LineChart },
]
</script>

<template>
  <aside :class="['sidebar', { collapsed: !sidebarOpen }]">
    <div class="sidebar-header">
      <div class="brand">
        <div class="brand-mark">
          <LineChart :size="17" :stroke-width="2" />
        </div>

        <div v-if="sidebarOpen" class="brand-text">
          <span class="brand-name">TradeJournal</span>
          <span class="brand-version">Ledger&nbsp;I</span>
        </div>
      </div>

      <button
        v-if="sidebarOpen"
        class="icon-button sidebar-close"
        @click="emit('close')"
      >
        <X :size="17" />
      </button>
    </div>

    <div v-if="sidebarOpen" class="workspace-label">
      Workspace
    </div>

    <nav class="navigation">
      <button
        v-for="item in navItems"
        :key="item.label"
        :class="['nav-item', { active: activePage === item.label }]"
        @click="emit('update:activePage', item.label)"
      >
        <component :is="item.icon" :size="18" :stroke-width="1.7" />
        <span v-if="sidebarOpen">{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-bottom">
      <button class="nav-item" @click="emit('openAccount')">
        <WalletCards :size="18" :stroke-width="1.7" />
        <span v-if="sidebarOpen">Account</span>
      </button>

      <button class="nav-item" @click="emit('openSettings')">
        <Settings :size="18" :stroke-width="1.7" />
        <span v-if="sidebarOpen">Settings</span>
      </button>

      <div v-if="sidebarOpen" class="connection-card">
        <div class="connection-status">
          <span :class="['status-dot', { live: account }]"></span>
          <span>{{ account ? account.broker : 'MT5 connection' }}</span>
        </div>

        <span class="connection-text">
          {{
            account
              ? `${account.server} · #${account.account_number}`
              : loading
                ? 'Connecting…'
                : 'Waiting for backend'
          }}
        </span>
      </div>
    </div>
  </aside>
</template>
