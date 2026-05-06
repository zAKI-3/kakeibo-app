/**
 * Kakeibo API Client
 * Cloudflare Workers への通信を担当
 */

const CONFIG_KEY = 'kakeibo_config'

function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

async function request(path, options = {}) {
  const cfg = getConfig()
  const baseUrl = cfg.apiUrl || ''
  const apiKey = cfg.apiKey || ''

  if (!baseUrl || !apiKey) {
    throw new Error('API URL と API Key を設定してください')
  }

  const url = `${baseUrl.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }

  return res.json()
}

// ===== Dashboard =====
async function getDashboard() {
  return request('/api/dashboard')
}

// ===== Transactions =====
async function getTransactions(month, type = 'all') {
  return request(`/api/transactions?month=${month}&type=${type}`)
}

async function getTransaction(id) {
  return request(`/api/transactions/${id}`)
}

async function createTransaction(data) {
  return request('/api/transactions', { method: 'POST', body: JSON.stringify(data) })
}

async function updateTransaction(id, data) {
  return request(`/api/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

async function deleteTransaction(id) {
  return request(`/api/transactions/${id}`, { method: 'DELETE' })
}

// ===== Master =====
async function getPayments() {
  return request('/api/master/payments')
}

async function getCards() {
  return request('/api/master/cards')
}

async function getAccounts() {
  return request('/api/master/accounts')
}

async function getCategories(type = 'all') {
  return request(`/api/master/categories?type=${type}&level=small`)
}

async function getCardPerks(cardId = '') {
  const q = cardId ? `?cardId=${cardId}` : ''
  return request(`/api/master/card-perks${q}`)
}

async function getLoans() {
  return request('/api/master/loans?active=true')
}

async function getInstallments() {
  return request('/api/master/installments?status=active')
}

// ===== Wishlist =====
async function getWishlist() {
  return request('/api/wishlist')
}

async function purchaseWishlistItem(id) {
  return request(`/api/wishlist/${id}/purchase`, { method: 'POST' })
}

// ===== Revolving =====
async function getRevolving() {
  return request('/api/revolving')
}

async function repayRevolving(id, data) {
  return request(`/api/revolving/${id}/repay`, { method: 'POST', body: JSON.stringify(data) })
}

// ===== Transfer =====
async function createTransfer(data) {
  return request('/api/transfer', { method: 'POST', body: JSON.stringify(data) })
}

// ===== Snapshot =====
async function createSnapshot(data) {
  return request('/api/snapshot', { method: 'POST', body: JSON.stringify(data) })
}

// ===== Installment =====
async function createInstallment(data) {
  return request('/api/installment', { method: 'POST', body: JSON.stringify(data) })
}

// ===== Cron (manual trigger) =====
async function triggerCron() {
  return request('/api/cron/daily', { method: 'POST' })
}

// ===== Helpers =====
function formatAmount(n) {
  if (n == null) return '---'
  return n.toLocaleString('ja-JP')
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

// In-memory cache (clears on page reload)
const cache = new Map()

async function cached(key, ttlMs, fn) {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < ttlMs) return hit.data
  const data = await fn()
  cache.set(key, { data, ts: now })
  return data
}

function clearCache() {
  cache.clear()
}

export {
  getConfig, saveConfig,
  getDashboard, getTransactions, getTransaction,
  createTransaction, updateTransaction, deleteTransaction,
  getPayments, getCards, getAccounts, getCategories,
  getCardPerks, getLoans, getInstallments,
  getWishlist, purchaseWishlistItem,
  getRevolving, repayRevolving,
  createTransfer, createSnapshot, createInstallment,
  triggerCron,
  formatAmount, formatDate, currentYearMonth, todayISO,
  cached, clearCache,
}
