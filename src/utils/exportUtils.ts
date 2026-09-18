/**
 * Export and Print Utilities for FUNCTIONAL REHAB LAB
 */

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJson(filename: string, data: unknown) {
  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(`${filename}.json`, jsonStr, 'application/json');
}

export function exportToCsv(filename: string, data: Record<string, unknown>[], customHeaders?: { key: string; label: string }[]) {
  if (!data || data.length === 0) {
    downloadFile(`${filename}.csv`, 'No records found\n', 'text/csv;charset=utf-8;');
    return;
  }

  const columns = customHeaders || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const headerRow = columns.map(col => `"${String(col.label).replace(/"/g, '""')}"`).join(',');

  const rows = data.map(item => {
    return columns.map(col => {
      const val = item[col.key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\r\n');
  downloadFile(`${filename}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

export function triggerPrint() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
