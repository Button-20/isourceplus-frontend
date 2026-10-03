// Read SMS recipient numbers out of an uploaded CSV or Excel (.xlsx) file.
//
// Returns the raw phone-like cell values; the SMS page's own parser then
// normalises them (0XX… → 233…), validates and de-duplicates, exactly as it
// does for typed numbers.
//
// Column choice: if the first non-empty row looks like a header and names a
// phone column ("phone", "mobile", "number", "msisdn", "contact", "tel",
// "cell"), only those columns are read and the header row is skipped.
// Otherwise every cell is scanned.

export const RECIPIENT_FILE_ACCEPT =
  ".csv,.txt,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const MAX_RECIPIENT_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const PHONE_HEADER_RE = /phone|mobile|msisdn|number|contact|tel|cell/i;

export class RecipientFileError extends Error {}

// Minimal RFC 4180 CSV parser: quoted fields, escaped quotes (""), CRLF/LF,
// and the delimiter auto-detected from the first line (comma, semicolon, tab).
export function parseCsv(text) {
  const src = String(text ?? "").replace(/^\uFEFF/, ""); // strip BOM
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of firstLine) if (ch in counts) counts[ch] += 1;
  const [best, bestCount] = Object.entries(counts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const delimiter = bestCount > 0 ? best : ",";

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Turn a cell into a string token. Excel stores phone numbers typed without a
// leading apostrophe as numbers, dropping the leading 0 (0241234567 →
// 241234567); the SMS parser accepts 9-digit numbers and re-adds 233.
const cellToToken = (cell) => {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "number")
    return Number.isInteger(cell) ? String(cell) : cell.toFixed(0);
  if (cell instanceof Date) return "";
  const text = String(cell).trim();
  // A single formatted number ("+233 20 123 4567", "024-123-4567",
  // "(024) 1234567") is compacted so the recipient parser — which splits on
  // spaces — sees it as one number. Cells listing several numbers keep their
  // commas/semicolons and are split later as usual.
  if (/\d/.test(text) && /^[+\d\s().-]+$/.test(text))
    return text.replace(/[\s().-]/g, "");
  return text;
};

// Scientific notation (2.33241E+11) means a spreadsheet already rounded the
// number away — it can't be recovered, so flag it instead of guessing.
const isScientific = (s) => /^\d+(\.\d+)?e\+\d+$/i.test(s);

export function extractRecipientTokens(rows) {
  const data = (Array.isArray(rows) ? rows : []).filter(
    (r) => Array.isArray(r) && r.some((c) => cellToToken(c) !== ""),
  );
  if (!data.length) return { tokens: [], scientific: 0, column: null };

  const header = data[0].map(cellToToken);
  const phoneCols = header
    .map((h, i) => (PHONE_HEADER_RE.test(h) && !/\d{6,}/.test(h) ? i : -1))
    .filter((i) => i >= 0);
  const body = phoneCols.length ? data.slice(1) : data;

  const tokens = [];
  let scientific = 0;
  for (const r of body) {
    const cells = phoneCols.length ? phoneCols.map((i) => r[i]) : r;
    for (const c of cells) {
      const t = cellToToken(c);
      if (!t) continue;
      if (isScientific(t)) {
        scientific += 1;
        continue;
      }
      tokens.push(t);
    }
  }
  return {
    tokens,
    scientific,
    column: phoneCols.length
      ? phoneCols.map((i) => header[i]).join(", ")
      : null,
  };
}

// File → { tokens, scientific, column }.
export async function readRecipientFile(file) {
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
  return extractRecipientTokens(rows);
}

// A starter CSV users can download, fill and re-upload.
export function downloadRecipientTemplate() {
  const csv = "phone,name\n0241234567,Ama Mensah\n233201234567,Kofi Boateng\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "sms-recipients-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
