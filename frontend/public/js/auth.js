// ==========================================================================
// AUTH SESSION MANAGEMENT & ROLE SWITCHER
// ==========================================================================

const demoRoles = {
  admin: { id: 'u-admin', name: 'Ban Lãnh Đạo (Admin)', email: 'admin@saovangfc.vn', role: 'admin' },
  coach: { id: 'u-coach', name: 'HLV. Nguyễn Văn Huấn', email: 'coach.huan@saovangfc.vn', role: 'coach' },
  player: { id: 'u-player', name: 'Nguyễn Quang Hải (#19)', email: 'quanghai19@saovangfc.vn', role: 'player' },
};

function getAuthUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr || userStr === 'undefined') {
    // Mặc định đăng nhập demo Admin
    setAuthSession(demoRoles.admin, 'demo-token');
    return demoRoles.admin;
  }
  try {
    return JSON.parse(userStr);
  } catch {
    return demoRoles.admin;
  }
}

function setAuthSession(user, token) {
  localStorage.setItem('user', JSON.stringify(user));
  if (token) localStorage.setItem('token', token);
}

function clearAuthSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

function renderNavbarAuth() {
  const container = document.getElementById('navbarAuth');
  if (!container) return;

  const user = getAuthUser();
  let roleBadge = '<span class="role-pill role-customer">Khách hàng</span>';
  if (user && user.role === 'admin') roleBadge = '<span class="role-pill role-admin">Quản trị viên</span>';
  else if (user && user.role === 'coach') roleBadge = '<span class="role-pill role-coach">HLV</span>';

  container.innerHTML = `
    <div class="user-badge" style="display: flex; align-items: center; gap: 8px;">
      <span>👤 ${user?.name || 'Thành viên'}</span>
      ${roleBadge}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', renderNavbarAuth);
