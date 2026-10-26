export default function BackendHomePage() {
  const endpoints = [
    { method: 'GET / PUT', path: '/api/clubs', desc: 'Thông tin câu lạc bộ bóng đá' },
    { method: 'GET / POST', path: '/api/players', desc: 'Danh sách cầu thủ & Thêm cầu thủ mới' },
    { method: 'GET / PUT / DELETE', path: '/api/players/[id]', desc: 'Chi tiết, sửa, xóa cầu thủ' },
    { method: 'GET / POST', path: '/api/schedules', desc: 'Danh sách lịch tập & Tạo buổi tập mới' },
    { method: 'GET / PUT / DELETE', path: '/api/schedules/[id]', desc: 'Chi tiết, sửa, xóa lịch tập' },
    { method: 'GET / POST', path: '/api/attendances', desc: 'Điểm danh buổi tập (đơn lẻ hoặc hàng loạt)' },
    { method: 'GET / POST', path: '/api/fields', desc: 'Danh sách sân tập & Thêm sân tập mới' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#16a34a', borderBottom: '2px solid #16a34a', paddingBottom: '12px' }}>
        ⚽ Football Club Management API - Backend
      </h1>
      <p style={{ color: '#4b5563', fontSize: '16px' }}>
        Hệ thống Backend API cho đồ án: <strong>QUẢN LÝ CÂU LẠC BỘ VÀ LỊCH TẬP BÓNG ĐÁ</strong>
      </p>

      <h2 style={{ marginTop: '32px', color: '#1f2937' }}>Các API Endpoints:</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {endpoints.map((ep) => (
          <div
            key={ep.path}
            style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 'bold',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginRight: '12px',
                }}
              >
                {ep.method}
              </span>
              <a
                href={ep.path.includes('[id]') ? '/api/players' : ep.path}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: 'monospace', fontSize: '15px', color: '#2563eb', textDecoration: 'none' }}
              >
                {ep.path}
              </a>
            </div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>{ep.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
