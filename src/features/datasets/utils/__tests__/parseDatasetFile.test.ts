import { describe, expect, it } from "vitest";
import { readSheet as readWorkerSheet } from "read-excel-file/web-worker";

import { parseDatasetFile, parseXlsxFile } from "../parseDatasetFile";

type RawXlsxCell = {
  createXml: (reference: string) => string;
};

type XlsxCell =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | RawXlsxCell;

function createCsvFile(headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => {
          if (value === null || value === undefined) return "";

          const text = String(value);
          return /[",\r\n]/.test(text)
            ? `"${text.replaceAll('"', '""')}"`
            : text;
        })
        .join(",")
    )
    .join("\n");

  return new File([csv], "test.csv", {
    type: "text/csv",
  });
}

function createXlsxFile(rows: XlsxCell[][], fileName = "test.xlsx") {
  const entries = createXlsxEntries(rows);
  const zip = createZip(entries);

  return new File([zip], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function createXlsxEntries(rows: XlsxCell[][]) {
  const sharedStrings = createSharedStrings(rows);

  return {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`,
    "xl/sharedStrings.xml": createSharedStringsXml(sharedStrings.values),
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cellXfs count="2">
    <xf numFmtId="0"/>
    <xf numFmtId="14" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`,
    "xl/worksheets/sheet1.xml": createWorksheetXml(
      rows,
      sharedStrings.indexByValue
    ),
  };
}

function createSharedStrings(rows: XlsxCell[][]) {
  const values: string[] = [];
  const indexByValue = new Map<string, number>();

  rows.forEach((row) => {
    row.forEach((value) => {
      if (typeof value !== "string") return;

      if (!indexByValue.has(value)) {
        indexByValue.set(value, values.length);
        values.push(value);
      }
    });
  });

  return {
    values,
    indexByValue,
  };
}

function createSharedStringsXml(values: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${values.length}" uniqueCount="${values.length}">
${values.map((value) => `  <si><t>${escapeXml(value)}</t></si>`).join("\n")}
</sst>`;
}

function createWorksheetXml(
  rows: XlsxCell[][],
  sharedStringIndexByValue: Map<string, number>
) {
  const maxColumns = Math.max(0, ...rows.map((row) => row.length));
  const dimension =
    rows.length > 0 && maxColumns > 0
      ? `A1:${columnName(maxColumns)}${rows.length}`
      : "A1";
  const sheetRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((value, columnIndex) =>
          createCellXml(
            value,
            `${columnName(columnIndex + 1)}${rowNumber}`,
            sharedStringIndexByValue
          )
        )
        .filter(Boolean)
        .join("");

      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

function isRawXlsxCell(value: XlsxCell): value is RawXlsxCell {
  return (
    typeof value === "object" &&
    value !== null &&
    "createXml" in value
  );
}

function createCellXml(
  value: XlsxCell,
  reference: string,
  sharedStringIndexByValue: Map<string, number>
) {
  if (value === null || value === undefined || value === "") return "";

  if (isRawXlsxCell(value)) {
    return value.createXml(reference);
  }

  if (typeof value === "boolean") {
    return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  if (typeof value === "number") {
    return `<c r="${reference}"><v>${value}</v></c>`;
  }

  if (value instanceof Date) {
    return `<c r="${reference}" s="1"><v>${dateToExcelSerial(value)}</v></c>`;
  }

  return `<c r="${reference}" t="s"><v>${sharedStringIndexByValue.get(value)}</v></c>`;
}

function columnName(index: number) {
  let name = "";
  let value = index;

  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }

  return name;
}

function dateToExcelSerial(date: Date) {
  const epoch = Date.UTC(1899, 11, 30);
  return (date.getTime() - epoch) / 86400000;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createZip(entries: Record<string, string>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  Object.entries(entries).forEach(([path, content]) => {
    const name = encoder.encode(path);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const localHeader = createLocalFileHeader(name, data, crc);
    const centralHeader = createCentralDirectoryHeader(name, data, crc, offset);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralDirectorySize = centralParts.reduce(
    (size, part) => size + part.length,
    0
  );
  const end = createEndOfCentralDirectory(
    Object.keys(entries).length,
    centralDirectorySize,
    offset
  );

  return concatUint8Arrays([...localParts, ...centralParts, end]);
}

function createLocalFileHeader(name: Uint8Array, data: Uint8Array, crc: number) {
  const header = new Uint8Array(30 + name.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, name.length, true);
  header.set(name, 30);

  return header;
}

function createCentralDirectoryHeader(
  name: Uint8Array,
  data: Uint8Array,
  crc: number,
  offset: number
) {
  const header = new Uint8Array(46 + name.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, data.length, true);
  view.setUint32(24, data.length, true);
  view.setUint16(28, name.length, true);
  view.setUint32(42, offset, true);
  header.set(name, 46);

  return header;
}

function createEndOfCentralDirectory(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number
) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);

  return header;
}

function concatUint8Arrays(parts: Uint8Array[]) {
  const output = new Uint8Array(
    parts.reduce((size, part) => size + part.length, 0)
  );
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

describe("parseDatasetFile", () => {
  it("strips UTF-8 BOM from the first CSV header", async () => {
    const file = createCsvFile(
      ["\uFEFFEmail", "Name"],
      [["valid@example.com", "Steffi"]]
    );

    const result = await parseDatasetFile(file);

    expect(result.columns.map((column) => column.label)).toEqual([
      "Email",
      "Name",
    ]);
    expect(result.columns.map((column) => column.key)).toEqual([
      "email",
      "name",
    ]);
    expect(result.rows[0].values).toEqual({
      email: "valid@example.com",
      name: "Steffi",
    });
  });

  it("normalizes blank CSV header cells to generated column labels", async () => {
    const file = createCsvFile(
      ["Name", ""],
      [["Steffi", "Internal note"]]
    );

    const result = await parseDatasetFile(file);

    expect(result.columns.map((column) => column.label)).toEqual([
      "Name",
      "Column 2",
    ]);
    expect(result.columns.map((column) => column.key)).toEqual([
      "name",
      "column_2",
    ]);
    expect(result.rows[0].values).toEqual({
      name: "Steffi",
      column_2: "Internal note",
    });
  });

  it("deduplicates normalized column keys without dropping values", async () => {
    const file = createCsvFile(
      ["First Name", "first-name", "first_name"],
      [["Steffi", "Maria", "K"]]
    );

    const result = await parseDatasetFile(file);

    expect(result.columns.map((column) => column.key)).toEqual([
      "first_name",
      "first_name_2",
      "first_name_3",
    ]);

    expect(result.rows[0].values).toEqual({
      first_name: "Steffi",
      first_name_2: "Maria",
      first_name_3: "K",
    });
  });

  it("marks rows with missing values as missing", async () => {
    const file = createCsvFile(
      ["Name", "Email"],
      [["Steffi", null]]
    );

    const result = await parseDatasetFile(file);

    expect(result.rows[0].validationState).toBe("missing");
    expect(result.rows[0].validationField).toBe("email");
  });

  it("marks rows with invalid emails as invalid", async () => {
    const file = createCsvFile(
      ["Name", "Email"],
      [["Steffi", "not-an-email"]]
    );

    const result = await parseDatasetFile(file);

    expect(result.rows[0].validationState).toBe("invalid");
    expect(result.rows[0].validationField).toBe("email");
  });

  it("parses valid XLSX files through the same ParsedDataset shape", async () => {
    const file = createXlsxFile([
      ["First Name", "Email"],
      ["Steffi", "valid@example.com"],
    ]);

    const result = await parseDatasetFile(file);

    expect(result.columns.map((column) => column.key)).toEqual([
      "first_name",
      "email",
    ]);
    expect(result.rows[0].values).toEqual({
      first_name: "Steffi",
      email: "valid@example.com",
    });
  });

  it("rejects empty XLSX files", async () => {
    const file = createXlsxFile([]);

    await expect(parseDatasetFile(file)).rejects.toThrow(
      "The uploaded dataset is empty."
    );
  });

  it("rejects invalid XLSX files", async () => {
    const file = new File(["not a workbook"], "broken.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await expect(parseDatasetFile(file)).rejects.toThrow(
      "XLSX file could not be parsed."
    );
  });

  it("parses XLSX numeric, boolean, date, and empty cells", async () => {
    const signupDate = new Date(Date.UTC(2026, 0, 15));
    const file = createXlsxFile([
      ["Name", "Score", "Active", "Signup Date", "Notes"],
      ["Steffi", 42, true, signupDate, null],
    ]);

    const result = await parseDatasetFile(file);

    expect(result.rows[0].values.name).toBe("Steffi");
    expect(result.rows[0].values.score).toBe(42);
    expect(result.rows[0].values.active).toBe(true);
    expect(result.rows[0].values.notes).toBeNull();
    expect(result.rows[0].values.signup_date).toBeInstanceOf(Date);
    expect((result.rows[0].values.signup_date as Date).toISOString()).toBe(
      "2026-01-15T00:00:00.000Z"
    );
  });

  it("recovers when read-excel-file hits undefined trim for blank string cells", async () => {
    const file = createXlsxFile([
      ["Name", "Notes"],
      [
        " Steffi ",
        {
          createXml: (reference) => `<c r="${reference}" t="str"/>`,
        },
      ],
    ]);

    const result = await parseXlsxFile(file, readWorkerSheet);

    expect(result.rows[0].values).toEqual({
      name: "Steffi",
      notes: null,
    });
  });

  it("maintains XLSX header ordering", async () => {
    const file = createXlsxFile([
      ["Email", "Name", "Active"],
      ["valid@example.com", "Steffi", false],
    ]);

    const result = await parseDatasetFile(file);

    expect(result.columns.map((column) => column.key)).toEqual([
      "email",
      "name",
      "active",
    ]);
  });
});
