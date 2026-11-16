// Read email invitation recipients out of an uploaded CSV or Excel (.xlsx)
// file. Mirrors utils/recipient-file.js (SMS), but keeps cell values intact so
// the email parser (parseEmailRecipients) can validate and de-duplicate them.
//
// Column choice: if the first non-empty row looks like a header and names an
// email column ("email", "e-mail", "address", "contact"), only those columns
// are read and the header row is skipped. Otherwise every cell is scanned.

import {
  MAX_RECIPIENT_FILE_BYTES,
  RecipientFileError,
  parseCsv,
} from "@/utils/recipient-file";

export { RecipientFileError };

export const EMAIL_FILE_ACCEPT =
  ".csv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const EMAIL_HEADER_RE = /e-?mail|address|contact/i;

const cellToToken = (cell) => {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return "";
  return String(cell).trim();
};

function extractEmailTokens(rows) {
  const data = (Array.isArray(rows) ? rows : []).filter(
    (r) => Array.isArray(r) && r.some((c) => cellToToken(c) !== ""),
  );
  if (!data.length) return { tokens: [], column: null };

  const header = data[0].map(cellToToken);
  const emailCols = header
    .map((h, i) => (EMAIL_HEADER_RE.test(h) && !/@/.test(h) ? i : -1))
    .filter((i) => i >= 0);
  const body = emailCols.length ? data.slice(1) : data;

  const tokens = [];
  for (const r of body) {
    const cells = emailCols.length ? emailCols.map((i) => r[i]) : r;
    for (const c of cells) {
      const t = cellToToken(c);
      if (t) tokens.push(t);
    }
  }
  return {
    tokens,
    column: emailCols.length
      ? emailCols.map((i) => header[i]).join(", ")
      : null,
  };
}

// File → { tokens, column }.
export async function readEmailRecipientFile(file) {
  if (!file) throw new RecipientFileError("No file selected.");
  if (file.size > MAX_RECIPIENT_FILE_BYTES)
    throw new RecipientFileError("File is too large — the limit is 5 MB.");

  const name = String(file.name || "").toLowerCase();
  let rows;
  if (name.endsWith(".xlsx")) {
    // Loaded on demand so the Excel reader stays out of the main bundle.
    const { readSheet } = await import("read-excel-file/browser");
    try {
      rows = await readSheet(file);
    } catch {
      throw new RecipientFileError(
        "Couldn't read that Excel file. Make sure it's a valid .xlsx workbook.",
      );
    }
  } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
    rows = parseCsv(await file.text());
  } else if (name.endsWith(".xls")) {
    throw new RecipientFileError(
      "Old .xls files aren't supported. Save it as .xlsx or .csv and try again.",
    );
  } else {
    throw new RecipientFileError("Upload a .csv or .xlsx file.");
  }
  return extractEmailTokens(rows);
}

// A starter CSV users can download, fill and re-upload.
export function downloadEmailRecipientTemplate() {
  const csv =
    "email,name\ncustomer@example.com,Ama Mensah\nsupplier@example.com,Kofi Boateng\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "email-recipients-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
