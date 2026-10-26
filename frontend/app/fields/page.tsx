'use client';

import { useState } from 'react';

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
  const [fields] = useState<FootballField[]>(defaultFields);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <span>🏟️</span> Quản Lý Sân Bóng & Cơ Sở Vật Chất
        </h1>
        <p className="text-sm text-slate-400 mt-1">Danh sách sân bãi tập luyện và thi đấu của câu lạc bộ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold">
                {f.fieldType}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  f.status === 'Khả dụng'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {f.status}
              </span>
            </div>
            <h3 className="font-bold text-white text-base">{f.name}</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <p>📍 {f.location}</p>
              <p>🌱 Bề mặt: <span className="text-slate-200">{f.surfaceType}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
