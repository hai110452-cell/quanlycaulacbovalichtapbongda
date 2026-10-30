'use client';

import { useState, useEffect } from 'react';

interface FootballField {
  id: string;
  name: string;
  location: string;
  fieldType: string;
  surfaceType: string;
  status: string;
}

const defaultFields: FootballField[] = [
  {
    id: 'field-1',
    name: 'Sân bóng Sao Vàng A (Sân 7)',
    location: 'Số 12 Đường Cầu Diễn, Bắc Từ Liêm, Hà Nội',
    fieldType: 'Sân 7 người',
    surfaceType: 'Cỏ nhân tạo',
    status: 'Khả dụng',
  },
  {
    id: 'field-2',
    name: 'Sân bóng Sao Vàng B (Sân 11)',
    location: 'Khu liên hợp thể thao Quốc Gia, Mỹ Đình',
    fieldType: 'Sân 11 người',
    surfaceType: 'Cỏ tự nhiên',
    status: 'Khả dụng',
  },
  {
    id: 'field-3',
    name: 'Sân trong nhà Futsal Center',
    location: 'Quận Nam Từ Liêm, Hà Nội',
    fieldType: 'Sân futsal',
    surfaceType: 'Sàn gỗ',
    status: 'Bảo trì',
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
            <article key={f.id} className="field-card">
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
