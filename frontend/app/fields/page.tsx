'use client';

import { useState, useEffect } from 'react';

interface FootballField {
  id: string;
  name: string;
  location: string;
  fieldType: string;
  surfaceType: string;
  status: string;
  image?: string;
}

const defaultFields: FootballField[] = [
  {
    id: 'field-c1-1',
    name: 'Sân bóng C1 - Sân 1 (Cỏ nhân tạo)',
    location: '1B Y Ngông, Tân Tiến, Buôn Ma Thuột • Giờ hoạt động: Thứ 2 – Chủ nhật: 24/24 • Hotline: 0983 830 955 / 0906 424 006 (250k – 350k/h)',
    fieldType: 'Sân bóng mini cỏ nhân tạo đạt chuẩn',
    surfaceType: 'Cỏ nhân tạo cao cấp & Dàn đèn cao áp ban đêm',
    status: 'Khả dụng',
    image: '/san-c1.jpg',
  },
  {
    id: 'field-c1-2',
    name: 'Sân bóng C1 - Sân 2 (Cỏ nhân tạo)',
    location: '1B Y Ngông, Tân Tiến, Buôn Ma Thuột • Giờ hoạt động: Thứ 2 – Chủ nhật: 24/24 • Hotline: 0983 830 955 / 0906 424 006 (250k – 350k/h)',
    fieldType: 'Sân bóng mini cỏ nhân tạo đạt chuẩn',
    surfaceType: 'Cỏ nhân tạo cao cấp & Dàn đèn cao áp ban đêm',
    status: 'Khả dụng',
    image: '/san-c1.jpg',
  },
];

export default function FieldsPage() {
  const [fields, setFields] = useState<FootballField[]>(defaultFields);

  useEffect(() => {
    fetch('/api/fields')
      .then((res) => res.json())
      .then((res) => {
        const list = res?.data || (Array.isArray(res) ? res : null);
        if (list && Array.isArray(list) && list.length > 0) {
          setFields(list);
        }
      })
      .catch((err) => console.warn('Lỗi kết nối /api/fields:', err));
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/css/fields.css" />

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>🏟️</span> Quản Lý Sân Bóng & Cơ Sở Vật Chất
          </h1>
          <p className="page-subtitle">Danh sách sân bãi tập luyện và thi đấu của câu lạc bộ</p>
        </div>
      </div>

      <section className="fields-grid">
        {fields.map((f) => {
          const isAvail = f.status === 'Khả dụng';
          return (
            <article key={f.id} className="field-card overflow-hidden">
              {f.image && (
                <div style={{ margin: '-24px -24px 16px -24px', height: '180px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={f.image}
                    alt={f.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', bottom: '8px', left: '12px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>
                    🏟️ SÂN C1
                  </div>
                </div>
              )}
              <div className="field-top">
                <span className={`badge ${isAvail ? 'badge-success' : 'badge-warning'}`}>
                  {f.status}
                </span>
                <span style={{ fontSize: '20px' }}>🏟️</span>
              </div>
              <h3 className="field-name">{f.name}</h3>
              <p className="field-location">
                📍 <span>{f.location}</span>
              </p>
              <div className="field-features">
                <div>
                  Loại: <strong>{f.fieldType}</strong>
                </div>
                <div>
                  Mặt sân: <strong>{f.surfaceType}</strong>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
