<script setup>
</script>

<template>
  <div class="shell">
    <header class="shell-header">
      <router-link to="/missions" class="brand">
        <span class="brand-mark">◆</span>
        <span class="brand-name">Developer Advisor</span>
      </router-link>
      <span class="brand-tag">세상을 거대한 디지털 구조로 본다</span>
      <nav class="nav">
        <router-link to="/missions/history" class="nav-link">성장 기록</router-link>
      </nav>
    </header>
    <main class="shell-main">
      <router-view />
    </main>
    <footer class="shell-footer">
      prototype v0.1 — 콘텐츠는 에이전트 생성 샘플입니다
    </footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.shell-header {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 18px 28px;
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
  color: var(--fg);
  font-weight: 700;
  font-size: 17px;
  flex-shrink: 0;
}
.brand-mark { color: var(--accent); }
.brand-tag {
  color: var(--fg-dim);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.nav {
  margin-left: auto;
  flex-shrink: 0;
}
.nav-link {
  color: var(--fg-dim);
  text-decoration: none;
  font-size: 13.5px;
  display: inline-flex;
  align-items: center;
  min-height: 40px;
}
.nav-link:hover {
  color: var(--accent);
}
.nav-link.router-link-active {
  color: var(--accent);
  font-weight: 600;
}
.shell-main {
  flex: 1;
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  padding: 28px;
  box-sizing: border-box;
}
.shell-footer {
  padding: 14px 28px;
  border-top: 1px solid var(--border);
  color: var(--fg-dim);
  font-size: 12px;
}

@media (max-width: 700px) {
  .shell-header {
    padding: 14px 16px;
    gap: 10px;
  }
  .brand-name { font-size: 15px; }
  .brand-tag {
    display: none;
  }
  .shell-main {
    padding: 16px;
  }
  .shell-footer {
    padding: 12px 16px;
    font-size: 11px;
  }
}
</style>
