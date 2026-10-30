// ==========================================================================
// AUTH - Quản lý phiên đăng nhập
// ==========================================================================

function getAuthUser() {
  const str = localStorage.getItem('user');
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

function requireLogin() {
  if (!getAuthUser()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

// ==========================================================================
// SIDEBAR - Render sidebar navigation
// ==========================================================================

function isAdmin() {
  const user = getAuthUser();
  return user && user.role === 'admin';
}

function isCustomer() {
  const user = getAuthUser();
  return !user || user.role !== 'admin';
}

const NAV_ITEMS = [
  { section: 'Tổng quan', items: [
    { href: '/index.html',        icon: '📊', label: 'Tổng quan',          id: 'dashboard' },
  ]},
  { section: 'Quản lý CLB', items: [
    { href: '/teams.html',        icon: '🏆', label: 'Quản lý đội',        id: 'teams' },
    { href: '/members.html',      icon: '👥', label: 'Thành viên',         id: 'members' },
    { href: '/coaches.html',      icon: '📋', label: 'Huấn luyện viên',    id: 'coaches' },
  ]},
  { section: 'Hoạt động', items: [
    { href: '/schedules.html',    icon: '📅', label: 'Lịch tập',           id: 'schedules' },
    { href: '/attendance.html',   icon: '✅', label: 'Điểm danh',          id: 'attendance' },
    { href: '/fees.html',         icon: '💰', label: 'Phí sinh hoạt',      id: 'fees' },
    { href: '/notifications.html',icon: '📢', label: 'Thông báo',          id: 'notifications', badge: '3' },
  ]},
];

function renderSidebar(activeId) {
  const user = getAuthUser();
  if (!user) return;

  const role = user.role || 'customer';
  document.body.classList.add('role-' + role);

  const el = document.getElementById('appSidebar');
  if (!el) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let navHTML = '';
  for (const section of NAV_ITEMS) {
    navHTML += `<div class="nav-section">
      <div class="nav-section-label">${section.section}</div>`;
    for (const item of section.items) {
      const isActive = currentPath === item.href.replace('/','') || activeId === item.id;
      const badgeHTML = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
      navHTML += `
        <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-text">${item.label}</span>
          ${badgeHTML}
        </a>`;
    }
    navHTML += `</div>`;
  }

  const roleLabels = { 
    admin: '🛡️ Quản trị viên (Admin)', 
    customer: '👤 Khách hàng (Hội viên)',
    coach: '📋 Huấn luyện viên', 
    player: '🏃 Cầu thủ' 
  };
  const roleName = roleLabels[user.role] || (user.role === 'admin' ? '🛡️ Quản trị viên' : '👤 Khách hàng');
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  el.innerHTML = `
    <a href="/index.html" class="sidebar-brand">
      <div class="brand-icon-wrap">⚽</div>
      <div class="brand-info">
        <div class="brand-name">Sao Vàng FC</div>
        <div class="brand-sub">Quản lý CLB Bóng đá</div>
      </div>
    </a>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${user.name || 'Thành viên'}</div>
          <div class="user-role">${roleName}</div>
        </div>
        <button class="logout-btn" onclick="logout()" title="Đăng xuất">🚪</button>
      </div>
    </div>`;

  // Tự động kiểm tra quyền để ẩn các thao tác quản trị đối với khách hàng
  if (!isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(btn => {
      btn.style.setProperty('display', 'none', 'important');
    });
  }
}

// ==========================================================================
// API CLIENT
// ==========================================================================

const API_BASE = 'http://localhost:5000/api';

async function apiGet(path) {
  try {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(API_BASE + path, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('API GET failed:', path, e.message);
    return null;
  }
}

async function apiPost(path, body) {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.message || `HTTP ${res.status}`); }
  return res.json();
}

async function apiPut(path, body) {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(API_BASE + path, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.message || `HTTP ${res.status}`); }
  return res.json();
}

async function apiDelete(path) {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(API_BASE + path, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) { const e = await res.json().catch(()=>{}); throw new Error(e?.message || `HTTP ${res.status}`); }
  return res.status !== 204 ? res.json() : null;
}

// ==========================================================================
// UTILS
// ==========================================================================

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function showToast(msg, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#f0fdf4', border: 'rgba(34,197,94,0.3)', color: '#15803d', icon: '✅' },
    error:   { bg: '#fef2f2', border: 'rgba(239,68,68,0.3)',  color: '#dc2626', icon: '❌' },
    warning: { bg: '#fffbeb', border: 'rgba(245,158,11,0.3)', color: '#b45309', icon: '⚠️' },
    info:    { bg: '#eff6ff', border: 'rgba(59,130,246,0.3)', color: '#2563eb', icon: 'ℹ️' },
  };
  const c = colors[type] || colors.success;

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:${c.bg}; border:1px solid ${c.border}; color:${c.color};
    padding:12px 18px; border-radius:12px; font-size:14px; font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.12);
    display:flex; align-items:center; gap:8px;
    animation:slideInToast 0.3s ease-out;
    font-family:'Inter',sans-serif; max-width:320px;
  `;
  toast.innerHTML = `${c.icon} ${msg}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInToast {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('appSidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
});
