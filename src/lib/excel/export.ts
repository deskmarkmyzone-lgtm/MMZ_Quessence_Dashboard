import * as XLSX from "xlsx";

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * Each object key becomes a column header.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string; format?: (value: unknown) => string | number }[],
  options: ExportOptions
) {
  const { filename, sheetName = "Sheet1" } = options;

  // Transform data using column definitions
  const rows = data.map((item) => {
    const row: Record<string, string | number> = {};
    columns.forEach((col) => {
      const value = item[col.key];
      row[col.label] = col.format ? col.format(value) : (value as string | number) ?? "";
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns based on header + content width
  const colWidths = columns.map((col) => {
    const headerLen = col.label.length;
    const maxContentLen = rows.reduce((max, row) => {
      const val = String(row[col.label] ?? "");
      return Math.max(max, val.length);
    }, 0);
    return { wch: Math.min(Math.max(headerLen, maxContentLen) + 2, 40) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export raw 2D array (including headers) to Excel.
 * Useful for complex layouts like invoices.
 */
export function exportArrayToExcel(
  data: (string | number | null)[][],
  options: ExportOptions
) {
  const { filename, sheetName = "Sheet1" } = options;

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
