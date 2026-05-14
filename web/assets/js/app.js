import * as API from './api.js'

const VERSION = '2026.05.15-1'

// ===== SVG Icons =====
const ICONS = `<svg style="display:none">
  <defs>
    <symbol id="i-home" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/></symbol>
    <symbol id="i-list" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h0M3 12h0M3 18h0"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" d="M5 12h14M12 5v14"/></symbol>
    <symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" d="M15 18l-6-6 6-6"/></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" d="M18 6L6 18M6 6l12 12"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" d="M9 18l6-6-6-6"/></symbol>
    <symbol id="i-card" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M2 11h20M6 16h2"/></symbol>
    <symbol id="i-transfer" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></symbol>
    <symbol id="i-star" viewBox="0 0 24 24"><polygon fill="none" stroke="currentColor" stroke-width="2" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></symbol>
    <symbol id="i-refresh" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M23 4v6h-6M1 20v-6h6"/><path fill="none" stroke="currentColor" stroke-width="2" d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></symbol>
    <symbol id="i-bank" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></symbol>
    <symbol id="i-cash" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></symbol>
    <symbol id="i-edit" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path fill="none" stroke="currentColor" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></symbol>
  </defs>
</svg>`

// ===== Router =====
let currentRoute = 'home'
let routeParams = {}

function navigate(route, params = {}) {
  currentRoute = route
  routeParams = params
  render()
}

// ===== State =====
const state = {
  dashboard: null,
  transactions: null,
  transactionsMonth: null,
  // master data (cached in API module)
  payments: null,
  cards: null,
  accounts: null,
  categories: null,
}

// ===== Render =====
function render() {
  const app = document.getElementById('app')
  const statusBar = renderStatusBar()
  const nav = renderNav()

  let screenHtml = ''
  switch (currentRoute) {
    case 'home':         screenHtml = renderHome(); break
    case 'logs':         screenHtml = renderLogs(); break
    case 'expense':      screenHtml = renderExpenseInput(); break
    case 'income':       screenHtml = renderIncomeInput(); break
    case 'transfer':     screenHtml = renderTransferInput(); break
    case 'installment':  screenHtml = renderInstallmentInput(); break
    case 'wishlist':     screenHtml = renderWishlist(); break
    case 'revo':         screenHtml = renderRevo(); break
    case 'settings':     screenHtml = renderSettings(); break
    default:             screenHtml = renderHome()
  }

  const noNav = ['expense', 'income', 'transfer', 'installment', 'wishlist', 'revo'].includes(currentRoute)

  app.innerHTML = `
    ${ICONS}
    ${statusBar}
    <div class="screen">${screenHtml}</div>
    ${noNav ? '' : nav}
  `

  bindEvents()
}

// ===== Status Bar =====
function renderStatusBar() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `
    <div class="status-bar">
      <span>${h}:${m}</span>
      <span class="status-bar-right">
        <svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="3" width="3" height="9" fill="currentColor"/><rect x="4" y="2" width="3" height="10" fill="currentColor"/><rect x="8" y="1" width="3" height="11" fill="currentColor"/><rect x="12" y="0" width="3" height="12" fill="currentColor"/></svg>
        <svg width="16" height="12" viewBox="0 0 24 12"><path d="M1 1h20a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H1V1z" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="3" width="14" height="6" rx="1" fill="currentColor"/></svg>
      </span>
    </div>`
}

// ===== Bottom Nav =====
function renderNav() {
  const items = [
    { id: 'home',     icon: 'i-home',     label: 'HOME' },
    { id: '_fab',     icon: 'i-plus',     label: '',     fab: true },
    { id: 'logs',     icon: 'i-list',     label: 'LOGS' },
    { id: 'settings', icon: 'i-settings', label: 'CONFIG' },
  ]
  return `
    <nav class="bottom-nav">
      ${items.map(it => {
        if (it.fab) return `<button class="nav-item fab" data-nav="fab"><svg><use href="#${it.icon}"/></svg></button>`
        const active = currentRoute === it.id ? 'active' : ''
        return `<button class="nav-item ${active}" data-nav="${it.id}"><svg><use href="#${it.icon}"/></svg><span>${it.label}</span></button>`
      }).join('')}
    </nav>`
}

// ===== Screens =====

// --- Home ---
function renderHome() {
  const d = state.dashboard
  if (!d) {
    return `<div class="terminal-prompt"><span class="prompt-user">user</span><span class="prompt-host">@kakeibo</span><span style="color:var(--text-3)">:</span><span class="prompt-path">~/dashboard</span><span style="color:var(--accent);font-weight:700">$</span><span style="color:var(--text-2)">loading...</span><span class="prompt-cursor"></span></div>
    <div class="state-message">データ取得中...</div>`
  }

  const avail = d.available || {}
  const cards = d.cards || []
  const recents = d.recentTransactions || []

  return `
    <div class="terminal-prompt">
      <span class="prompt-user">user</span><span class="prompt-host">@kakeibo</span>
      <span style="color:var(--text-3)">:</span><span class="prompt-path">~/dashboard</span>
      <span style="color:var(--accent);font-weight:700">$</span>
      <span style="color:var(--text-2)">cat status.json</span>
      <span class="prompt-cursor"></span>
    </div>

    <div class="available-card">
      <div class="available-label">AVAILABLE THIS MONTH</div>
      <div class="available-amount">
        <span class="yen">¥</span>${API.formatAmount(avail.amount ?? 0)}
      </div>
      <div class="available-breakdown">
        <div class="breakdown-row"><span>// 収入</span><span>+¥${API.formatAmount(avail.income ?? 0)}</span></div>
        <div class="breakdown-row"><span>// 固定費</span><span>−¥${API.formatAmount(avail.fixedExpenses ?? 0)}</span></div>
      </div>
    </div>

    ${cards.length > 0 ? `
      <div class="section-title">CARD USAGE</div>
      ${cards.map(card => {
        const pct = card.limitEnabled ? Math.min((card.currentUsage / card.monthlyLimit) * 100, 100) : 0
        const barClass = pct > 80 ? 'danger' : pct > 60 ? 'warning' : ''
        return `
          <div class="card-usage-item">
            <div class="card-usage-header">
              <div class="card-logo" style="background:linear-gradient(135deg,#333,#111)">${card.name.slice(0,2)}</div>
              <div class="card-usage-name">${card.name}</div>
              <div class="card-usage-amount">−¥${API.formatAmount(card.currentUsage)}</div>
            </div>
            ${card.limitEnabled ? `
              <div class="usage-bar-bg">
                <div class="usage-bar-fill ${barClass}" style="width:${pct}%"></div>
              </div>
              <div style="font-size:9px;color:var(--text-3);margin-top:4px;text-align:right">${pct.toFixed(0)}% / ¥${API.formatAmount(card.monthlyLimit)}</div>
            ` : ''}
          </div>`
      }).join('')}
    ` : ''}

    <div class="section-title">QUICK ACTIONS</div>
    <div class="quick-actions">
      <button class="quick-action-btn" data-action="nav-expense">
        <svg><use href="#i-cash"/></svg>
        <div><div class="quick-action-label">支出</div><div class="quick-action-sub">EXPENSE</div></div>
      </button>
      <button class="quick-action-btn" data-action="nav-income">
        <svg><use href="#i-bank"/></svg>
        <div><div class="quick-action-label">収入</div><div class="quick-action-sub">INCOME</div></div>
      </button>
      <button class="quick-action-btn" data-action="nav-transfer">
        <svg><use href="#i-transfer"/></svg>
        <div><div class="quick-action-label">振替</div><div class="quick-action-sub">TRANSFER</div></div>
      </button>
      <button class="quick-action-btn" data-action="nav-wishlist">
        <svg><use href="#i-star"/></svg>
        <div><div class="quick-action-label">欲しいもの</div><div class="quick-action-sub">WISHLIST</div></div>
      </button>
    </div>

    ${recents.length > 0 ? `
      <div class="section-title">RECENT</div>
      <div style="margin:0 16px">
        <div class="transaction-list">
          ${recents.slice(0,5).map(tx => renderTransactionItem(tx)).join('')}
        </div>
      </div>
    ` : ''}
    <div style="height:20px"></div>
  `
}

// --- Logs ---
function renderLogs() {
  const month = state.transactionsMonth || API.currentYearMonth()
  const data = state.transactions
  const [y, m] = month.split('-')

  let content
  if (!data) {
    content = `<div class="state-message">データ取得中...</div>`
  } else {
    const groups = data.groups || []
    const income = data.summary?.income ?? 0
    const expense = data.summary?.expense ?? 0
    const net = income - expense

    content = `
      <div class="summary-bar">
        <div class="summary-cell">
          <div class="summary-cell-label">INCOME</div>
          <div class="summary-cell-value income">+¥${API.formatAmount(income)}</div>
        </div>
        <div class="summary-cell">
          <div class="summary-cell-label">EXPENSE</div>
          <div class="summary-cell-value expense">−¥${API.formatAmount(expense)}</div>
        </div>
        <div class="summary-cell">
          <div class="summary-cell-label">NET</div>
          <div class="summary-cell-value net" style="color:${net >= 0 ? 'var(--accent)' : 'var(--danger)'}">
            ${net >= 0 ? '+' : ''}¥${API.formatAmount(Math.abs(net))}
          </div>
        </div>
      </div>
      ${groups.length === 0 ? '<div class="state-message">この月の取引はありません</div>' :
        groups.map(g => `
          <div class="day-group">
            <div class="day-header">
              <span class="day-date">${g.date}</span>
              <span class="day-total">−¥${API.formatAmount(g.totalExpense)}</span>
            </div>
            <div class="transaction-list">
              ${g.transactions.map(tx => renderTransactionItem(tx)).join('')}
            </div>
          </div>
        `).join('')
      }
    `
  }

  const prevMonth = new Date(parseInt(y), parseInt(m) - 2, 1)
  const nextMonth = new Date(parseInt(y), parseInt(m), 1)
  const nowMonth = API.currentYearMonth()
  const nextStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
  const prevStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px 12px">
      <button style="background:none;border:none;color:var(--accent);font-size:18px;cursor:pointer;font-family:var(--font-mono)" data-action="prev-month" data-month="${prevStr}">◀</button>
      <span style="font-size:18px;font-weight:700;color:var(--text-1);">> ${y}.${m}</span>
      <button style="background:none;border:none;color:${nextStr <= nowMonth ? 'var(--accent)' : 'var(--text-3)'};font-size:18px;cursor:pointer;font-family:var(--font-mono)" data-action="next-month" data-month="${nextStr}" ${nextStr > nowMonth ? 'disabled' : ''}>▶</button>
    </div>
    ${content}
  `
}

function renderTransactionItem(tx) {
  const type = tx.type === '支出' ? 'expense' : tx.type === '収入' ? 'income' : 'transfer'
  const sign = type === 'expense' ? '−' : type === 'income' ? '+' : '↔'
  const catName = tx.category?.name || tx.paymentMethod?.name || '---'
  const meta = [tx.paymentMethod?.name, tx.memo].filter(Boolean).join(' · ')
  return `
    <div class="transaction-item" data-action="tx-detail" data-id="${tx.id}">
      <div class="transaction-icon">${tx.category?.icon || (type === 'income' ? '💰' : type === 'transfer' ? '↔' : '💸')}</div>
      <div class="transaction-info">
        <div class="transaction-category">${catName}</div>
        ${meta ? `<div class="transaction-meta">${meta}</div>` : ''}
      </div>
      <div class="transaction-amount ${type}">${sign}¥${API.formatAmount(tx.amount)}</div>
    </div>`
}

// --- Expense Input ---
let expenseState = {
  amount: '',
  datetime: API.todayISO(),
  paymentMethodId: null,
  paymentMethodName: '',
  categoryId: null,
  categoryName: '',
  memo: '',
}

function renderExpenseInput() {
  const s = expenseState
  return `
    <div style="display:flex;flex-direction:column;height:calc(100dvh - 44px)">
      <div class="input-header">
        <button class="header-back" data-action="back"><svg><use href="#i-back"/></svg></button>
        <div class="header-title">支出入力</div>
        <div style="width:36px"></div>
      </div>

      <div class="amount-display">
        <div class="amount-prefix">EXPENSE</div>
        <div class="amount-input-wrapper">
          <span class="amount-currency">¥</span>
          <input class="amount-input" id="amount-input" type="number" inputmode="numeric"
            placeholder="0" value="${s.amount}" data-bind="expense-amount">
        </div>
      </div>

      <div style="flex:1;overflow-y:auto;padding-bottom:16px">
        <div class="form-section">
          <div class="form-label">支払方法</div>
          <div class="field-row" data-action="pick-payment">
            <span class="field-row-label">PAYMENT</span>
            <span class="field-row-value">${s.paymentMethodName || '選択してください'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">カテゴリ</div>
          <div class="field-row" data-action="pick-category-expense">
            <span class="field-row-label">CATEGORY</span>
            <span class="field-row-value">${s.categoryName || '選択してください'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">日時</div>
          <input type="datetime-local" class="field-input" value="${s.datetime}" data-bind="expense-datetime">
        </div>

        <div class="form-section">
          <div class="form-label">メモ</div>
          <textarea class="field-input" placeholder="任意" data-bind="expense-memo">${s.memo}</textarea>
        </div>

        <button class="save-button" data-action="save-expense" ${!s.amount ? 'disabled' : ''}>
          SAVE
        </button>
      </div>
    </div>`
}

// --- Income Input ---
let incomeState = {
  amount: '',
  datetime: API.todayISO(),
  accountId: null,
  accountName: '',
  categoryId: null,
  categoryName: '',
  memo: '',
  isSalary: false,
}

function renderIncomeInput() {
  const s = incomeState
  return `
    <div style="display:flex;flex-direction:column;height:calc(100dvh - 44px)">
      <div class="input-header">
        <button class="header-back" data-action="back"><svg><use href="#i-back"/></svg></button>
        <div class="header-title">収入入力</div>
        <div style="width:36px"></div>
      </div>

      <div class="amount-display">
        <div class="amount-prefix">INCOME</div>
        <div class="amount-input-wrapper">
          <span class="amount-currency" style="color:var(--accent)">¥</span>
          <input class="amount-input" id="amount-input" type="number" inputmode="numeric"
            placeholder="0" value="${s.amount}" data-bind="income-amount"
            style="color:var(--accent)">
        </div>
      </div>

      <div style="flex:1;overflow-y:auto;padding-bottom:16px">
        <div class="form-section">
          <div class="form-label">入金先口座</div>
          <div class="field-row" data-action="pick-account">
            <span class="field-row-label">ACCOUNT</span>
            <span class="field-row-value">${s.accountName || '選択してください'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">カテゴリ</div>
          <div class="field-row" data-action="pick-category-income">
            <span class="field-row-label">CATEGORY</span>
            <span class="field-row-value">${s.categoryName || '選択してください'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">日時</div>
          <input type="datetime-local" class="field-input" value="${s.datetime}" data-bind="income-datetime">
        </div>

        <div class="form-section">
          <div class="form-label">メモ</div>
          <textarea class="field-input" placeholder="任意" data-bind="income-memo">${s.memo}</textarea>
        </div>

        <div class="form-section" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px">
          <span style="font-size:11px;color:var(--text-2);font-weight:700">給料入力として記録 → 月次予算作成</span>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="salary-toggle" ${s.isSalary ? 'checked' : ''} style="accent-color:var(--accent)">
            <span style="font-size:10px;color:var(--text-3)">給料</span>
          </label>
        </div>

        <button class="save-button" data-action="save-income" ${!s.amount ? 'disabled' : ''}>
          SAVE
        </button>
      </div>
    </div>`
}

// --- Transfer ---
let transferState = {
  amount: '',
  datetime: API.todayISO(),
  fromAccountId: null,
  fromAccountName: '',
  toAccountId: null,
  toAccountName: '',
  fee: '',
  memo: '',
}

function renderTransferInput() {
  const s = transferState
  return `
    <div style="display:flex;flex-direction:column;height:calc(100dvh - 44px)">
      <div class="input-header">
        <button class="header-back" data-action="back"><svg><use href="#i-back"/></svg></button>
        <div class="header-title">振替入力</div>
        <div style="width:36px"></div>
      </div>

      <div style="flex:1;overflow-y:auto;padding-bottom:16px">
        <div class="form-section" style="margin-top:16px">
          <div class="form-label">金額</div>
          <div style="display:flex;align-items:center;gap:8px;background:var(--surface-1);border:1px solid var(--border);padding:12px 14px">
            <span style="font-size:20px;color:var(--text-2)">¥</span>
            <input type="number" inputmode="numeric" class="field-input" placeholder="0"
              style="border:none;background:transparent;font-size:24px;font-weight:800;padding:0"
              value="${s.amount}" data-bind="transfer-amount">
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">振替元</div>
          <div class="field-row" data-action="pick-from-account">
            <span class="field-row-label">FROM</span>
            <span class="field-row-value">${s.fromAccountName || '選択'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div style="padding:4px 16px;text-align:center;font-size:18px;color:var(--accent)">↓</div>

        <div class="form-section">
          <div class="form-label">振替先</div>
          <div class="field-row" data-action="pick-to-account">
            <span class="field-row-label">TO</span>
            <span class="field-row-value">${s.toAccountName || '選択'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">日時</div>
          <input type="datetime-local" class="field-input" value="${s.datetime}" data-bind="transfer-datetime">
        </div>

        <div class="form-section">
          <div class="form-label">手数料（任意）</div>
          <input type="number" inputmode="numeric" class="field-input" placeholder="0"
            value="${s.fee}" data-bind="transfer-fee">
        </div>

        <div class="form-section">
          <div class="form-label">メモ</div>
          <textarea class="field-input" placeholder="任意" data-bind="transfer-memo">${s.memo}</textarea>
        </div>

        <button class="save-button" data-action="save-transfer" ${!s.amount ? 'disabled' : ''}>
          SAVE
        </button>
      </div>
    </div>`
}

// --- Installment ---
let installState = {
  name: '',
  totalAmount: '',
  months: '',
  cardId: null,
  cardName: '',
  categoryId: null,
  categoryName: '',
  firstPaymentMonth: API.currentYearMonth(),
  memo: '',
}

function renderInstallmentInput() {
  const s = installState
  return `
    <div style="display:flex;flex-direction:column;height:calc(100dvh - 44px)">
      <div class="input-header">
        <button class="header-back" data-action="back"><svg><use href="#i-back"/></svg></button>
        <div class="header-title">分割払い登録</div>
        <div style="width:36px"></div>
      </div>

      <div style="flex:1;overflow-y:auto;padding-bottom:16px">
        <div class="form-section" style="margin-top:16px">
          <div class="form-label">商品名</div>
          <input type="text" class="field-input" placeholder="例: MacBook Pro"
            value="${s.name}" data-bind="install-name">
        </div>

        <div class="form-section">
          <div class="form-label">総額（円）</div>
          <input type="number" inputmode="numeric" class="field-input" placeholder="0"
            value="${s.totalAmount}" data-bind="install-amount">
        </div>

        <div class="form-section">
          <div class="form-label">分割回数</div>
          <div class="chip-container" style="padding:0;margin:0">
            ${[3, 6, 10, 12, 18, 24, 36].map(n => `
              <button class="chip ${s.months == n ? 'active' : ''}" data-action="set-months" data-value="${n}">
                ${n}回
              </button>`).join('')}
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">使用カード</div>
          <div class="field-row" data-action="pick-card">
            <span class="field-row-label">CARD</span>
            <span class="field-row-value">${s.cardName || '選択してください'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">カテゴリ</div>
          <div class="field-row" data-action="pick-category-expense">
            <span class="field-row-label">CATEGORY</span>
            <span class="field-row-value">${s.categoryName || '選択してください'}<svg><use href="#i-chevron"/></svg></span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">初回支払月</div>
          <input type="month" class="field-input" value="${s.firstPaymentMonth}" data-bind="install-month">
        </div>

        <div class="form-section">
          <div class="form-label">メモ</div>
          <textarea class="field-input" placeholder="任意" data-bind="install-memo">${s.memo}</textarea>
        </div>

        <button class="save-button" data-action="save-installment"
          ${!s.name || !s.totalAmount || !s.months || !s.cardId ? 'disabled' : ''}>
          REGISTER
        </button>
      </div>
    </div>`
}

// --- Wishlist ---
function renderWishlist() {
  return `
    <div class="input-header">
      <button class="header-back" data-action="back"><svg><use href="#i-back"/></svg></button>
      <div class="header-title">欲しいもの</div>
      <div style="width:36px"></div>
    </div>
    <div id="wishlist-content" class="state-message">読込中...</div>
  `
}

// --- Revo ---
function renderRevo() {
  return `
    <div class="input-header">
      <button class="header-back" data-action="back"><svg><use href="#i-back"/></svg></button>
      <div class="header-title">リボ返済</div>
      <div style="width:36px"></div>
    </div>
    <div id="revo-content" class="state-message">読込中...</div>
  `
}

// --- Settings ---
function renderSettings() {
  const cfg = API.getConfig()
  return `
    <div class="terminal-prompt">
      <span class="prompt-user">user</span><span class="prompt-host">@kakeibo</span>
      <span style="color:var(--text-3)">:</span><span class="prompt-path">~/config</span>
      <span style="color:var(--accent);font-weight:700">$</span>
      <span style="color:var(--text-2)">vi settings</span>
      <span class="prompt-cursor"></span>
    </div>

    <div style="margin:16px">
      <div style="font-size:10px;color:var(--text-2);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;padding:0 4px">
        <span style="color:var(--accent)">## </span>API 設定
      </div>
      <div style="background:var(--surface-1);border:1px solid var(--border)">
        <div style="padding:12px 14px;border-bottom:1px solid var(--border-dim)">
          <div style="font-size:10px;color:var(--text-3);font-weight:700;margin-bottom:6px">API URL</div>
          <input type="url" class="field-input" placeholder="https://xxx.workers.dev"
            value="${cfg.apiUrl || ''}" data-bind="cfg-url"
            style="border:none;background:transparent;padding:0;font-size:12px">
        </div>
        <div style="padding:12px 14px">
          <div style="font-size:10px;color:var(--text-3);font-weight:700;margin-bottom:6px">API KEY</div>
          <input type="password" class="field-input" placeholder="Bearer token"
            value="${cfg.apiKey || ''}" data-bind="cfg-key"
            style="border:none;background:transparent;padding:0;font-size:12px">
        </div>
      </div>
      <button class="save-button" data-action="save-config" style="margin:16px 0">SAVE CONFIG</button>
    </div>

    <div style="margin:0 16px">
      <div style="font-size:10px;color:var(--text-2);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;padding:0 4px">
        <span style="color:var(--accent)">## </span>操作
      </div>
      <div style="background:var(--surface-1);border:1px solid var(--border)">
        <button class="settings-item" data-action="trigger-cron"
          style="width:100%;background:none;border:none;border-bottom:1px solid var(--border-dim);padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;color:var(--text-1)">
          <svg width="18" height="18" style="color:var(--accent)"><use href="#i-refresh"/></svg>
          <span style="flex:1;font-size:12px;font-weight:600;text-align:left">Cron 手動実行（固定費・ローン自動記録）</span>
        </button>
        <button class="settings-item" data-action="nav-revo"
          style="width:100%;background:none;border:none;border-bottom:1px solid var(--border-dim);padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;color:var(--text-1)">
          <svg width="18" height="18" style="color:var(--warning)"><use href="#i-card"/></svg>
          <span style="flex:1;font-size:12px;font-weight:600;text-align:left">リボ返済</span>
          <svg width="12" height="12" style="color:var(--text-3)"><use href="#i-chevron"/></svg>
        </button>
        <button class="settings-item" data-action="nav-installment"
          style="width:100%;background:none;border:none;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;color:var(--text-1)">
          <svg width="18" height="18" style="color:var(--accent)"><use href="#i-cash"/></svg>
          <span style="flex:1;font-size:12px;font-weight:600;text-align:left">分割払い登録</span>
          <svg width="12" height="12" style="color:var(--text-3)"><use href="#i-chevron"/></svg>
        </button>
      </div>
    </div>

    <div style="margin:24px 16px;font-size:10px;color:var(--text-3);text-align:center">
      kakeibo.app <span style="color:var(--accent);font-weight:700">${VERSION}</span> // Notion + Cloudflare Workers<br>
      <a href="https://notion.so" target="_blank" style="color:var(--accent)">Notion で詳細管理</a>
    </div>
  `
}

// ===== Picker Sheets =====
async function showPicker(title, items, onSelect, selectedId = null) {
  const close = () => document.body.removeChild(overlay)

  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })

  const sheet = document.createElement('div')
  sheet.className = 'modal-sheet'

  const handle = document.createElement('div')
  handle.className = 'modal-handle'

  const header = document.createElement('div')
  header.style.cssText = 'padding:12px 20px 8px;font-size:13px;font-weight:700;color:var(--text-1);border-bottom:1px solid var(--border-dim);display:flex;justify-content:space-between;align-items:center'
  header.innerHTML = `<span>[${title}]</span>`

  const closeBtn = document.createElement('button')
  closeBtn.textContent = '×'
  closeBtn.style.cssText = 'background:none;border:none;cursor:pointer;color:var(--text-2);font-size:20px;line-height:1;padding:4px 8px;touch-action:manipulation;-webkit-tap-highlight-color:transparent'
  closeBtn.addEventListener('touchend', e => { e.preventDefault(); close() }, { passive: false })
  closeBtn.addEventListener('click', close)
  header.appendChild(closeBtn)

  const list = document.createElement('div')
  list.className = 'picker-list'
  let selectedRow = null
  items.forEach(it => {
    const isSelected = selectedId && it.id === selectedId
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'picker-item' + (isSelected ? ' selected' : '')
    row.innerHTML = `
      ${it.emoji ? `<span style="font-size:18px">${it.emoji}</span>` : ''}
      <div style="flex:1">
        <div class="picker-label">${it.label}</div>
        ${it.sub ? `<div class="picker-sub">${it.sub}</div>` : ''}
      </div>
      ${isSelected ? `<span style="color:var(--accent);font-size:16px">✓</span>` : ''}`
    row.addEventListener('click', () => { onSelect(it); close() })
    if (isSelected) selectedRow = row
    list.appendChild(row)
  })

  sheet.append(handle, header, list)
  overlay.appendChild(sheet)
  document.body.appendChild(overlay)
  if (selectedRow) requestAnimationFrame(() => selectedRow.scrollIntoView({ block: 'nearest' }))
}

async function showTransactionDetail(id) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `<div class="modal-sheet"><div class="modal-handle"></div><div class="state-message">読込中...</div></div>`
  document.body.appendChild(overlay)

  try {
    const { transaction: tx } = await API.getTransaction(id)
    const type = tx.type === '支出' ? 'expense' : tx.type === '収入' ? 'income' : 'transfer'
    const sign = type === 'expense' ? '−' : type === 'income' ? '+' : '↔'
    const sheet = overlay.querySelector('.modal-sheet')
    sheet.innerHTML = `
      <div class="modal-handle"></div>
      <div style="text-align:center;padding:24px 16px 28px;border-bottom:1px solid var(--border-dim)">
        <div style="font-size:9px;color:var(--accent);font-weight:700;letter-spacing:0.2em;margin-bottom:8px">$ TRANSACTION</div>
        <div style="font-size:48px;font-weight:800;letter-spacing:-0.04em;color:${type === 'expense' ? 'var(--danger)' : 'var(--accent)'}">
          ${sign}¥${API.formatAmount(tx.amount)}
        </div>
        <div style="font-size:10px;color:var(--text-3);margin-top:8px">${tx.datetime ? API.formatDate(tx.datetime) : ''}</div>
      </div>
      <div style="padding:16px">
        ${tx.category?.name ? `<div class="detail-row"><span class="detail-row-label">カテゴリ</span><span class="detail-row-value">${tx.category.icon || ''} ${tx.category.name}</span></div>` : ''}
        ${tx.paymentMethod?.name ? `<div class="detail-row"><span class="detail-row-label">支払方法</span><span class="detail-row-value">${tx.paymentMethod.name}</span></div>` : ''}
        ${tx.memo ? `<div class="detail-row"><span class="detail-row-label">メモ</span><span class="detail-row-value">${tx.memo}</span></div>` : ''}
        <div class="detail-row"><span class="detail-row-label">記録元</span><span class="detail-row-value">${tx.source || '手動'}</span></div>
        <button class="delete-button" data-action="delete-tx" data-id="${tx.id}">削除</button>
      </div>`

    sheet.querySelector('[data-action="delete-tx"]').addEventListener('click', async () => {
      if (!confirm('この取引を削除しますか？')) return
      await API.deleteTransaction(tx.id)
      document.body.removeChild(overlay)
      state.transactions = null
      API.clearCache()
      loadLogsData(state.transactionsMonth)
    })
  } catch (e) {
    overlay.querySelector('.modal-sheet').innerHTML = `<div class="modal-handle"></div><div class="state-message">エラー: ${e.message}</div>`
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) document.body.removeChild(overlay)
  })
}

// ===== Event Binding =====
function bindEvents() {
  const app = document.getElementById('app')

  // ---- Input bindings ----
  app.querySelectorAll('[data-bind]').forEach(el => {
    el.addEventListener('input', e => {
      const key = e.target.dataset.bind
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      handleBind(key, val)
    })
  })

  // Salary toggle
  const salaryToggle = app.querySelector('#salary-toggle')
  if (salaryToggle) {
    salaryToggle.addEventListener('change', e => {
      incomeState.isSalary = e.target.checked
    })
  }

  // ---- Click handlers ----
  app.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    await handleAction(btn.dataset.action, btn)
  })
}

function handleBind(key, val) {
  switch (key) {
    case 'expense-amount':   expenseState.amount = val; updateSaveButton(); break
    case 'expense-datetime': expenseState.datetime = val; break
    case 'expense-memo':     expenseState.memo = val; break
    case 'income-amount':    incomeState.amount = val; updateSaveButton(); break
    case 'income-datetime':  incomeState.datetime = val; break
    case 'income-memo':      incomeState.memo = val; break
    case 'transfer-amount':  transferState.amount = val; updateSaveButton(); break
    case 'transfer-datetime': transferState.datetime = val; break
    case 'transfer-fee':     transferState.fee = val; break
    case 'transfer-memo':    transferState.memo = val; break
    case 'install-name':     installState.name = val; updateSaveButton(); break
    case 'install-amount':   installState.totalAmount = val; updateSaveButton(); break
    case 'install-month':    installState.firstPaymentMonth = val; break
    case 'install-memo':     installState.memo = val; break
    case 'cfg-url':
    case 'cfg-key':          break // saved on button click
  }
}

function updateSaveButton() {
  const btn = document.querySelector('.save-button')
  if (!btn) return
  switch (currentRoute) {
    case 'expense':     btn.disabled = !expenseState.amount; break
    case 'income':      btn.disabled = !incomeState.amount; break
    case 'transfer':    btn.disabled = !transferState.amount; break
    case 'installment': btn.disabled = !installState.name || !installState.totalAmount || !installState.months || !installState.cardId; break
  }
}

async function handleAction(action, el) {
  switch (action) {
    case 'back': navigate('home'); break
    case 'nav-home': navigate('home'); break
    case 'nav-expense': navigate('expense'); break
    case 'nav-income': navigate('income'); break
    case 'nav-transfer': navigate('transfer'); break
    case 'nav-wishlist': navigate('wishlist'); loadWishlistData(); break
    case 'nav-revo': navigate('revo'); loadRevoData(); break
    case 'nav-installment': navigate('installment'); break
    case 'fab': showInputMenu(); break

    case 'prev-month':
      state.transactions = null
      loadLogsData(el.dataset.month)
      break
    case 'next-month':
      state.transactions = null
      loadLogsData(el.dataset.month)
      break

    case 'tx-detail':
      await showTransactionDetail(el.dataset.id)
      break

    // Pickers
    case 'pick-payment':
      await pickPaymentMethod()
      break
    case 'pick-card':
      await pickCard()
      break
    case 'pick-account':
      await pickAccount('income')
      break
    case 'pick-from-account':
      await pickAccount('from')
      break
    case 'pick-to-account':
      await pickAccount('to')
      break
    case 'pick-category-expense':
      await pickCategory('expense')
      break
    case 'pick-category-income':
      await pickCategory('income')
      break

    case 'set-months':
      installState.months = parseInt(el.dataset.value)
      render()
      break

    // Save actions
    case 'save-expense':  await saveExpense(); break
    case 'save-income':   await saveIncome(); break
    case 'save-transfer': await saveTransfer(); break
    case 'save-installment': await saveInstallment(); break

    case 'save-config': {
      const url = document.querySelector('[data-bind="cfg-url"]')?.value || ''
      const key = document.querySelector('[data-bind="cfg-key"]')?.value || ''
      API.saveConfig({ apiUrl: url.trim(), apiKey: key.trim() })
      showToast('設定を保存しました')
      API.clearCache()
      break
    }

    case 'trigger-cron':
      await runCron()
      break

    // Nav
    case 'nav': navigate(el.dataset.nav); break
  }
}

// ===== Input Menu (FAB) =====
function showInputMenu() {
  const items = [
    { label: '支出を入力', sub: 'EXPENSE', action: 'nav-expense' },
    { label: '収入を入力', sub: 'INCOME',  action: 'nav-income' },
    { label: '振替を入力', sub: 'TRANSFER', action: 'nav-transfer' },
    { label: '分割払い登録', sub: 'INSTALLMENT', action: 'nav-installment' },
    { label: '欲しいもの', sub: 'WISHLIST', action: 'nav-wishlist' },
    { label: 'リボ返済', sub: 'REVOLVING', action: 'nav-revo' },
  ]
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div style="padding:12px 20px 8px;font-size:11px;font-weight:700;color:var(--text-3);border-bottom:1px solid var(--border-dim)">// INPUT TYPE</div>
      <div class="picker-list">
        ${items.map((it, i) => `
          <div class="picker-item" data-index="${i}">
            <div>
              <div class="picker-label">${it.label}</div>
              <div class="picker-sub">${it.sub}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`

  overlay.addEventListener('click', e => {
    const item = e.target.closest('[data-index]')
    if (item) {
      const { action } = items[parseInt(item.dataset.index)]
      document.body.removeChild(overlay)
      handleAction(action, {})
      if (action === 'nav-wishlist') loadWishlistData()
      if (action === 'nav-revo') loadRevoData()
    } else if (e.target === overlay) {
      document.body.removeChild(overlay)
    }
  })
  document.body.appendChild(overlay)
}

// ===== Pickers =====
async function pickPaymentMethod() {
  try {
    const { payments } = await API.cached('payments', 300000, API.getPayments)
    const items = payments.map(p => ({ label: p.name, sub: p.types?.join(', '), id: p.id }))
    showPicker('支払方法', items, item => {
      expenseState.paymentMethodId = item.id
      expenseState.paymentMethodName = item.label
      render()
    }, expenseState.paymentMethodId)
  } catch (e) { showToast(`エラー: ${e.message}`) }
}

async function pickCard() {
  try {
    const { cards } = await API.cached('cards', 300000, API.getCards)
    const items = cards.map(c => ({ label: c.name, sub: c.types?.join(', '), id: c.id }))
    showPicker('カード選択', items, item => {
      installState.cardId = item.id
      installState.cardName = item.label
      render()
    }, installState.cardId)
  } catch (e) { showToast(`エラー: ${e.message}`) }
}

async function pickAccount(mode) {
  try {
    const { accounts } = await API.cached('accounts', 300000, API.getAccounts)
    const items = accounts.map(a => ({ label: a.name, sub: `¥${API.formatAmount(a.balance)}`, id: a.id }))
    const currentAccountId = mode === 'income' ? incomeState.accountId
      : mode === 'from' ? transferState.fromAccountId : transferState.toAccountId
    showPicker('口座選択', items, item => {
      if (mode === 'income') {
        incomeState.accountId = item.id
        incomeState.accountName = item.label
      } else if (mode === 'from') {
        transferState.fromAccountId = item.id
        transferState.fromAccountName = item.label
      } else {
        transferState.toAccountId = item.id
        transferState.toAccountName = item.label
      }
      render()
    }, currentAccountId)
  } catch (e) { showToast(`エラー: ${e.message}`) }
}

async function pickCategory(type) {
  try {
    const level = type === 'income' ? 'large' : 'small'
    const { categories } = await API.cached(`cat-${type}`, 300000, () => API.getCategories(type, level))
    const items = categories.map(c => ({ label: c.name, emoji: c.icon, id: c.id }))
    const currentCategoryId = currentRoute === 'expense' ? expenseState.categoryId
      : currentRoute === 'income' ? incomeState.categoryId : installState.categoryId
    showPicker('カテゴリ', items, item => {
      if (currentRoute === 'expense') {
        expenseState.categoryId = item.id
        expenseState.categoryName = item.label
      } else if (currentRoute === 'income') {
        incomeState.categoryId = item.id
        incomeState.categoryName = item.label
      } else if (currentRoute === 'installment') {
        installState.categoryId = item.id
        installState.categoryName = item.label
      }
      render()
    }, currentCategoryId)
  } catch (e) { showToast(`エラー: ${e.message}`) }
}

// ===== Save Actions =====
async function saveExpense() {
  const s = expenseState
  const btn = document.querySelector('.save-button')
  if (btn) btn.disabled = true
  try {
    await API.createTransaction({
      datetime: s.datetime || new Date().toISOString(),
      type: 'expense',
      amount: parseInt(s.amount),
      paymentMethodId: s.paymentMethodId,
      categoryId: s.categoryId,
      memo: s.memo,
    })
    expenseState = { amount: '', datetime: API.todayISO(), paymentMethodId: null, paymentMethodName: '', categoryId: null, categoryName: '', memo: '' }
    API.clearCache()
    showToast('支出を記録しました')
    navigate('home')
    loadDashboard()
  } catch (e) {
    showToast(`エラー: ${e.message}`)
    if (btn) btn.disabled = false
  }
}

async function saveIncome() {
  const s = incomeState
  const btn = document.querySelector('.save-button')
  if (btn) btn.disabled = true
  try {
    const tx = await API.createTransaction({
      datetime: s.datetime || new Date().toISOString(),
      type: 'income',
      amount: parseInt(s.amount),
      categoryId: s.categoryId,
      memo: s.memo,
    })
    if (s.isSalary) {
      const month = (s.datetime || '').slice(0, 7) || API.currentYearMonth()
      await API.createSnapshot({
        yearMonth: month,
        salaryAmount: parseInt(s.amount),
        salaryDate: (s.datetime || '').slice(0, 10),
      }).catch(() => {})
    }
    incomeState = { amount: '', datetime: API.todayISO(), accountId: null, accountName: '', categoryId: null, categoryName: '', memo: '', isSalary: false }
    API.clearCache()
    showToast('収入を記録しました')
    navigate('home')
    loadDashboard()
  } catch (e) {
    showToast(`エラー: ${e.message}`)
    if (btn) btn.disabled = false
  }
}

async function saveTransfer() {
  const s = transferState
  const btn = document.querySelector('.save-button')
  if (btn) btn.disabled = true
  try {
    await API.createTransfer({
      amount: parseInt(s.amount),
      datetime: s.datetime || new Date().toISOString(),
      fromAccountId: s.fromAccountId,
      toAccountId: s.toAccountId,
      fee: s.fee ? parseInt(s.fee) : 0,
      memo: s.memo,
    })
    transferState = { amount: '', datetime: API.todayISO(), fromAccountId: null, fromAccountName: '', toAccountId: null, toAccountName: '', fee: '', memo: '' }
    API.clearCache()
    showToast('振替を記録しました')
    navigate('home')
  } catch (e) {
    showToast(`エラー: ${e.message}`)
    if (btn) btn.disabled = false
  }
}

async function saveInstallment() {
  const s = installState
  const btn = document.querySelector('.save-button')
  if (btn) btn.disabled = true
  try {
    const res = await API.createInstallment({
      name: s.name,
      totalAmount: parseInt(s.totalAmount),
      months: s.months,
      cardId: s.cardId,
      categoryId: s.categoryId,
      firstPaymentMonth: s.firstPaymentMonth,
      memo: s.memo,
    })
    installState = { name: '', totalAmount: '', months: '', cardId: null, cardName: '', categoryId: null, categoryName: '', firstPaymentMonth: API.currentYearMonth(), memo: '' }
    API.clearCache()
    showToast(`分割払いを登録しました（月¥${API.formatAmount(res.monthlyPayment)}）`)
    navigate('home')
  } catch (e) {
    showToast(`エラー: ${e.message}`)
    if (btn) btn.disabled = false
  }
}

// ===== Async Data Loaders =====
async function loadDashboard() {
  try {
    state.dashboard = await API.getDashboard()
    if (currentRoute === 'home') render()
  } catch (e) {
    if (currentRoute === 'home') {
      const screen = document.querySelector('.screen')
      if (screen) screen.innerHTML = `<div class="state-message">エラー: ${e.message}</div>`
    }
  }
}

async function loadLogsData(month) {
  month = month || API.currentYearMonth()
  state.transactionsMonth = month
  if (currentRoute === 'logs') render()
  try {
    state.transactions = await API.getTransactions(month)
    if (currentRoute === 'logs') render()
  } catch (e) {
    const screen = document.querySelector('.screen')
    if (screen) screen.innerHTML = `<div class="state-message">エラー: ${e.message}</div>`
  }
}

async function loadWishlistData() {
  const el = document.getElementById('wishlist-content')
  if (!el) return
  try {
    const { wishlist } = await API.getWishlist()
    if (!document.getElementById('wishlist-content')) return
    document.getElementById('wishlist-content').outerHTML = `
      <div id="wishlist-content">
        ${wishlist.length === 0 ? '<div class="state-message">欲しいものはありません</div>' :
          wishlist.map(item => `
            <div style="background:var(--surface-1);border:1px solid var(--border);margin:0 16px 8px;padding:12px;display:flex;align-items:center;gap:12px">
              <div style="width:60px;height:60px;background:var(--surface-2);border:1px solid var(--border-dim);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">
                ${item.emoji || '🛍️'}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--text-1)">${item.name}</div>
                <div style="font-size:14px;color:var(--accent);font-weight:800;margin-top:4px">¥${API.formatAmount(item.price)}</div>
                <div style="font-size:9px;color:var(--text-3);margin-top:4px;text-transform:uppercase">${item.priority || ''}</div>
              </div>
              <button style="background:var(--accent);color:#0A0A0B;border:none;padding:8px 12px;font-size:10px;font-weight:800;font-family:var(--font-mono);cursor:pointer"
                data-wishlist-id="${item.id}">BUY</button>
            </div>`).join('')}
      </div>`

    document.querySelectorAll('[data-wishlist-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.wishlistId
        if (!confirm('購入済みにしますか？')) return
        try {
          await API.purchaseWishlistItem(id)
          showToast('購入済みにしました')
          loadWishlistData()
        } catch (e) { showToast(`エラー: ${e.message}`) }
      })
    })
  } catch (e) {
    const el2 = document.getElementById('wishlist-content')
    if (el2) el2.innerHTML = `<div class="state-message">エラー: ${e.message}</div>`
  }
}

async function loadRevoData() {
  const el = document.getElementById('revo-content')
  if (!el) return
  try {
    const { revolving } = await API.getRevolving()
    if (!document.getElementById('revo-content')) return
    document.getElementById('revo-content').outerHTML = `
      <div id="revo-content">
        ${revolving.length === 0 ? '<div class="state-message">リボ払いはありません</div>' :
          revolving.map(revo => `
            <div style="background:var(--surface-1);border:1px solid var(--border);margin:0 16px 12px;padding:14px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-1)">${revo.name}</div>
                  <div style="font-size:11px;color:var(--danger);font-weight:700;margin-top:4px">残債: ¥${API.formatAmount(revo.remaining)}</div>
                </div>
                <div style="font-size:11px;color:var(--warning);font-weight:700">年利 ${revo.annualRate}%</div>
              </div>
              <div style="display:flex;gap:8px">
                <input type="number" inputmode="numeric" class="field-input" placeholder="返済額 (円)"
                  id="revo-amount-${revo.id}" style="flex:1">
                <button style="background:var(--accent);color:#0A0A0B;border:none;padding:10px 14px;font-size:11px;font-weight:800;font-family:var(--font-mono);cursor:pointer"
                  data-revo-id="${revo.id}">REPAY</button>
              </div>
            </div>`).join('')}
      </div>`

    document.querySelectorAll('[data-revo-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.revoId
        const amountEl = document.getElementById(`revo-amount-${id}`)
        const amount = parseInt(amountEl?.value || '0')
        if (!amount) { showToast('金額を入力してください'); return }
        try {
          btn.disabled = true
          await API.repayRevolving(id, { amount, type: 'normal' })
          showToast('返済を記録しました')
          API.clearCache()
          navigate('home')
          loadDashboard()
        } catch (e) {
          showToast(`エラー: ${e.message}`)
          btn.disabled = false
        }
      })
    })
  } catch (e) {
    const el2 = document.getElementById('revo-content')
    if (el2) el2.innerHTML = `<div class="state-message">エラー: ${e.message}</div>`
  }
}

async function runCron() {
  const btn = document.querySelector('[data-action="trigger-cron"]')
  if (btn) btn.style.opacity = '0.5'
  try {
    const res = await API.triggerCron()
    const r = res.results
    showToast(`完了: 固定費${r.fixedCosts.processed}件 / ローン${r.loans.processed}件 / カード${r.cardSettlements.processed}件`)
  } catch (e) {
    showToast(`エラー: ${e.message}`)
  } finally {
    if (btn) btn.style.opacity = ''
  }
}

// ===== Nav click =====
document.addEventListener('click', e => {
  const navItem = e.target.closest('[data-nav]')
  if (!navItem) return
  const dest = navItem.dataset.nav
  if (dest === 'fab') { showInputMenu(); return }
  if (dest === 'logs' && currentRoute !== 'logs') {
    navigate('logs')
    loadLogsData(API.currentYearMonth())
  } else if (dest !== currentRoute) {
    navigate(dest)
  }
})

// ===== Toast =====
function showToast(msg) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  t.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:var(--surface-1);border:1px solid var(--border-strong);
    color:var(--text-1);padding:10px 16px;font-size:11px;font-family:var(--font-mono);
    font-weight:600;z-index:1000;max-width:320px;text-align:center;
    box-shadow:0 4px 20px rgba(0,0,0,0.5);white-space:pre-line`
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

// ===== Init =====
async function init() {
  render()
  loadDashboard()
}

init()
