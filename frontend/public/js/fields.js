// ==========================================================================
// FIELDS LOGIC
// ==========================================================================

const defaultFields = [
  {
    id: 'field-c1-1',
    name: 'Sân bóng C1 - Sân 1 (Cỏ nhân tạo)',
    location: '1B Y Ngông, Tân Tiến, Buôn Ma Thuột • Thứ 2 – CN: 24/24 • Hotline: 0983 830 955 / 0906 424 006',
    fieldType: 'Sân mini cỏ nhân tạo',
    surfaceType: 'Cỏ nhân tạo cao cấp & Đèn cao áp ban đêm (250k - 350k/h)',
    status: 'Khả dụng',
    image: 'san-c1.jpg',
  },
  {
    id: 'field-c1-2',
    name: 'Sân bóng C1 - Sân 2 (Cỏ nhân tạo)',
    location: '1B Y Ngông, Tân Tiến, Buôn Ma Thuột • Thứ 2 – CN: 24/24 • Hotline: 0983 830 955 / 0906 424 006',
    fieldType: 'Sân mini cỏ nhân tạo',
    surfaceType: 'Cỏ nhân tạo cao cấp & Đèn cao áp ban đêm (250k - 350k/h)',
    status: 'Khả dụng',
    image: 'san-c1.jpg',
  },
  {
    id: 'field-1',
    name: 'Sân bóng C1 (Sân 1)',
    location: 'Số 12 Đường Cầu Diễn, Bắc Từ Liêm, Hà Nội',
    fieldType: 'Sân 7 người',
    surfaceType: 'Cỏ nhân tạo cao cấp',
    status: 'Khả dụng',
    image: 'san-c1.jpg',
  },
  {
    id: 'field-2',
    name: 'Sân bóng C1 (Sân 2)',
    location: 'Khu liên hợp thể thao Sân C1 mở rộng',
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
      <article class="field-card" style="overflow: hidden;">
        ${f.image ? `
          <div style="margin: -24px -24px 16px -24px; height: 180px; overflow: hidden; position: relative;">
            <img src="${f.image}" alt="${f.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; bottom: 8px; left: 12px; background: rgba(0,0,0,0.65); padding: 3px 8px; border-radius: 6px; font-size: 11px; color: #fff; font-weight: bold;">
              🏟️ SÂN C1
            </div>
          </div>
        ` : ''}
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
