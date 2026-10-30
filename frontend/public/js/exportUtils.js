/**
 * exportUtils.js - Tiện ích xuất Excel (CSV UTF-8 BOM) và in ấn / PDF cho trang tĩnh
 */

function exportToCSV(filename, headers, rows) {
  let csvContent = '\uFEFF'; // UTF-8 BOM
  const escapedHeaders = headers.map(h => `"${String(h).replace(/"/g, '""')}"`);
  csvContent += escapedHeaders.join(',') + '\r\n';

  rows.forEach(row => {
    const escapedRow = row.map(cell => {
      const val = cell !== undefined && cell !== null ? String(cell) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvContent += escapedRow.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function printReport({ title, subtitle, filterInfo, tableHeaders, tableRows, summary }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cấp quyền cho phép mở popup trên trình duyệt!');
    return;
  }

  const exportDate = new Date().toLocaleString('vi-VN');
  const summaryHtml = summary && summary.length > 0
    ? `
      <div style="display: flex; gap: 20px; margin-bottom: 24px; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        ${summary.map(s => `
          <div>
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">${s.label}:</span>
            <div style="font-size: 15px; font-weight: bold; color: #0f172a;">${s.value}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const tableHeaderHtml = tableHeaders.map(h => `
    <th style="border: 1px solid #cbd5e1; padding: 10px 12px; background: #0f172a; color: #ffffff; font-size: 12px; text-align: left;">
      ${h}
    </th>
  `).join('');

  const tableRowsHtml = tableRows.map((row, i) => `
    <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      ${row.map(cell => `
        <td style="border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 12px; color: #1e293b;">
          ${cell !== undefined && cell !== null ? cell : '—'}
        </td>
      `).join('')}
    </tr>
  `).join('');

  const content = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Sao Vàng FC</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 40px; }
        @media print { body { margin: 20px; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 50px; height: 50px; background: #059669; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px;">⚽</div>
          <div>
            <h1 style="margin: 0; font-size: 19px; color: #065f46;">CÂU LẠC BỘ BÓNG ĐÁ SAO VÀNG FC</h1>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">Hệ Thống Quản Lý Câu Lạc Bộ & Lịch Tập Bóng Đá Chuyên Nghiệp</p>
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <div><strong>Ngày xuất:</strong> ${exportDate}</div>
          <div><strong>Trạng thái:</strong> Báo cáo chính thức</div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="margin: 0 0 6px; font-size: 18px; color: #0f172a;">${title}</h2>
        ${subtitle ? `<p style="margin: 0; font-size: 13px; color: #475569;">${subtitle}</p>` : ''}
        ${filterInfo ? `<p style="margin: 4px 0 0; font-size: 12px; color: #0284c7; font-style: italic;">* ${filterInfo}</p>` : ''}
      </div>

      ${summaryHtml}

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 36px;">
        <thead><tr>${tableHeaderHtml}</tr></thead>
        <tbody>${tableRowsHtml}</tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 48px; page-break-inside: avoid;">
        <div style="text-align: center; width: 200px;">
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 50px;">NGƯỜI LẬP BÁO CÁO</div>
          <div style="font-size: 12px; color: #64748b;">(Ký & ghi rõ họ tên)</div>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 50px;">BAN HUẤN LUYỆN</div>
          <div style="font-size: 12px; color: #065f46; font-weight: 600;">HLV. Nguyễn Văn Huấn</div>
        </div>
      </div>

      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 24px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🖨️ In Báo Cáo / Lưu PDF
        </button>
        <button onclick="window.close()" style="margin-left: 10px; padding: 10px 20px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Đóng
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
}
