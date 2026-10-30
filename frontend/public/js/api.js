// ==========================================================================
// API CLIENT - KẾT NỐI BACKEND (PORT 5000) HOẶC FALLBACK DỮ LIỆU
// ==========================================================================

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = {
  getToken() {
    return localStorage.getItem('token');
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async get(endpoint) {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { credentials: 'omit', headers: this.getHeaders() });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json && json.data !== undefined ? json.data : json;
    } catch (err) {
      console.warn(`Lỗi gọi API GET ${endpoint}, chuyển sang sử dụng dữ liệu lưu trữ cục bộ:`, err);
      return null;
    }
  },

  async post(endpoint, data) {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json && json.data !== undefined ? json.data : json;
    } catch (err) {
      console.warn(`Lỗi gọi API POST ${endpoint}:`, err);
      return null;
    }
  },

  async put(endpoint, data) {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json && json.data !== undefined ? json.data : json;
    } catch (err) {
      console.warn(`Lỗi gọi API PUT ${endpoint}:`, err);
      return null;
    }
  },

  async delete(endpoint) {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const json = await res.json();
      return json && json.data !== undefined ? json.data : json;
    } catch (err) {
      console.warn(`Lỗi gọi API DELETE ${endpoint}:`, err);
      return null;
    }
  }
};
