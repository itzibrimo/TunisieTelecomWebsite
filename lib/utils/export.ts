/* =============================================================================
 * Export utilities — CSV, Excel (XLSX), PDF, Copy to clipboard
 * ============================================================================= */

/* ── CSV Export ── */
export function exportCSV<T extends Record<string, unknown>>(data: T[], columns: { key: string; label: string }[], filename: string = "export.csv") {
  const headers = columns.map(c => c.label).join(",");
  const rows = data.map(row =>
    columns.map(c => {
      const val = String(row[c.key] ?? "");
      return val.includes(",") || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

/* ── Excel Export (HTML table → .xls) ── */
export function exportExcel<T extends Record<string, unknown>>(data: T[], columns: { key: string; label: string }[], filename: string = "export.xls") {
  const headerRow = columns.map(c => `<th style="background:#4F46E5;color:white;padding:8px 12px;font-weight:600;text-align:left">${c.label}</th>`).join("");
  const bodyRows = data.map(row => {
    const cells = columns.map(c => `<td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${String(row[c.key] ?? "")}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(blob, filename);
}

/* ── PDF Export (print-ready HTML) ── */
export function exportPDF<T extends Record<string, unknown>>(data: T[], columns: { key: string; label: string }[], title: string = "Export", filename: string = "export.html") {
  const headerRow = columns.map(c => `<th style="padding:8px 12px;background:#4F46E5;color:white;text-align:left;font-weight:600">${c.label}</th>`).join("");
  const bodyRows = data.map(row =>
    `<tr>${columns.map(c => `<td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${String(row[c.key] ?? "")}</td>`).join("")}</tr>`
  ).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui,sans-serif;margin:40px;color:#111}h1{font-size:20px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 12px;text-align:left}th{background:#4F46E5;color:white;font-weight:600}tr:nth-child(even){background:#f9fafb}@media print{body{margin:20px}}</style></head><body><h1>${title}</h1><p style="color:#6b7280;font-size:12px;margin-bottom:16px">Exporté le ${new Date().toLocaleDateString("fr-FR")}</p><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  downloadBlob(blob, filename);
  // Auto-print
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

/* ── Copy to clipboard ── */
export async function copyToClipboard<T extends Record<string, unknown>>(data: T[], columns: { key: string; label: string }[]): Promise<boolean> {
  const headers = columns.map(c => c.label).join("\t");
  const rows = data.map(row => columns.map(c => String(row[c.key] ?? "")).join("\t")).join("\n");
  const text = [headers, ...rows].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ── Download helper ── */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
