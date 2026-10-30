// ==========================================================================
// FIELDS LOGIC
// ==========================================================================

const defaultFields = [
  {
    id: 'field-1',
    name: 'Sân bóng Sao Vàng A (Sân 7)',
    location: 'Số 12 Đường Cầu Diễn, Bắc Từ Liêm, Hà Nội',
    fieldType: 'Sân 7 người',
    surfaceType: 'Cỏ nhân tạo cao cấp',
    status: 'Khả dụng',
  },
  {
    id: 'field-2',
    name: 'Sân bóng Sao Vàng B (Sân 11)',
    location: 'Khu liên hợp thể thao Mỹ Đình, Nam Từ Liêm',
    fieldType: 'Sân 11 người',
    surfaceType: 'Cỏ tự nhiên đạt chuẩn',
    status: 'Khả dụng',
  },
  {
    id: 'field-3',
    name: 'Sân trong nhà Futsal Arena',
    location: 'Số 88 Hồ Tùng Mậu, Cầu Giấy, Hà Nội',
    fieldType: 'Sân Futsal 5 người',
    surfaceType: 'Sàn gỗ cao su chống trượt',
    status: 'Bảo trì',
  },
];

async function initFields() {
  const container = document.getElementById('fieldsContainer');
  if (!container) return;

  let fields = await apiClient.get('/fields');
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    fields = defaultFields;
  }

  container.innerHTML = fields.map((f) => {
    const isAvail = f.status === 'Khả dụng';
    return `
      <article class="field-card">
        <div class="field-top">
          <span class="badge ${isAvail ? 'badge-success' : 'badge-warning'}">${f.status || 'Khả dụng'}</span>
          <span style="font-size: 20px;">🏟️</span>
        </div>
        <h3 class="field-name">${f.name}</h3>
        <p class="field-location">📍 <span>${f.location}</span></p>
        <div class="field-features">
          <div>Loại: <strong>${f.fieldType || 'Sân 7'}</strong></div>
          <div>Mặt sân: <strong>${f.surfaceType || 'Cỏ nhân tạo'}</strong></div>
        </div>
      </article>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initFields);
