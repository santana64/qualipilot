import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

const BRAND = "#1e40af";
const TEXT = "#1e293b";
const MUTED = "#64748b";
const LIGHT = "#f1f5f9";
const PAGE_W = 595.28;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function decodeEntities(str: string) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

type Node =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "aside"; text: string }
  | { type: "spacer" };

function parseHtml(html: string): Node[] {
  const nodes: Node[] = [];

  // h1
  html = html.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, inner) => {
    nodes.push({ type: "h1", text: stripTags(inner) });
    return "[[PLACEHOLDER]]";
  });

  // sections
  const sectionRe = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let sectionMatch;
  const sections: string[] = [];
  while ((sectionMatch = sectionRe.exec(html)) !== null) {
    sections.push(sectionMatch[1]);
  }

  for (const section of sections) {
    // h2
    const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(section);
    if (h2) nodes.push({ type: "h2", text: stripTags(h2[1]) });

    // table
    const tableMatch = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(section);
    if (tableMatch) {
      const theadMatch = /<thead[^>]*>([\s\S]*?)<\/thead>/i.exec(tableMatch[1]);
      const tbodyMatch = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(tableMatch[1]);
      const headers: string[] = [];
      const rows: string[][] = [];
      if (theadMatch) {
        const ths = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) ?? [];
        for (const th of ths) headers.push(stripTags(th));
      }
      if (tbodyMatch) {
        const trs = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) ?? [];
        for (const tr of trs) {
          const tds = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? [];
          rows.push(tds.map((td) => stripTags(td)));
        }
      }
      if (headers.length || rows.length) {
        nodes.push({ type: "table", headers, rows });
        continue;
      }
    }

    // ul
    const ulMatch = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(section);
    if (ulMatch) {
      const lis = ulMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? [];
      nodes.push({ type: "ul", items: lis.map((li) => stripTags(li)) });
      continue;
    }

    // p
    const pMatches = section.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
    for (const p of pMatches) {
      const text = stripTags(p);
      if (text) nodes.push({ type: "p", text });
    }
  }

  // aside disclaimer
  const asideMatch = /<aside[^>]*>([\s\S]*?)<\/aside>/i.exec(html);
  if (asideMatch) nodes.push({ type: "aside", text: stripTags(asideMatch[1]) });

  return nodes;
}

function drawTableRow(
  doc: InstanceType<typeof PDFDocument>,
  cells: string[],
  colWidths: number[],
  x: number,
  y: number,
  isHeader: boolean,
  isAlt: boolean,
) {
  const rowH = 18;
  const bg = isHeader ? BRAND : isAlt ? LIGHT : "#ffffff";
  const fg = isHeader ? "#ffffff" : TEXT;
  const fontSize = isHeader ? 8 : 9;

  doc.save();
  doc.rect(x, y, CONTENT_W, rowH).fill(bg);
  doc.restore();

  let cx = x;
  for (let i = 0; i < cells.length; i++) {
    const w = colWidths[i] ?? 80;
    doc
      .font(isHeader ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fontSize)
      .fillColor(fg)
      .text(cells[i] ?? "", cx + 4, y + 4, { width: w - 8, lineBreak: false, ellipsis: true });
    cx += w;
  }
  return rowH;
}

export async function renderPdfBuffer(input: { title: string; contentHtml?: string; contentText?: string }) {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true, info: { Title: input.title, Author: "QualiPilot" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // Always parse HTML for proper entity decoding and structure
  const html = input.contentHtml ?? `<p>${decodeEntities(input.contentText ?? "")}</p>`;
  const nodes = parseHtml(html);

  // Header bar
  doc.save();
  doc.rect(0, 0, PAGE_W, 6).fill(BRAND);
  doc.restore();

  // Title
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(TEXT).text(input.title, MARGIN, 28, { width: CONTENT_W });
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`Généré par QualiPilot — ${new Date().toLocaleDateString("fr-FR")}`, { width: CONTENT_W });

  // Separator
  doc.moveDown(0.8);
  const sepY = doc.y;
  doc.save().moveTo(MARGIN, sepY).lineTo(PAGE_W - MARGIN, sepY).lineWidth(0.5).strokeColor("#e2e8f0").stroke().restore();
  doc.moveDown(1);

  for (const node of nodes) {
    // Skip duplicated h1 (already rendered as title)
    if (node.type === "h1") continue;

    if (node.type === "h2") {
      if (doc.y > doc.page.height - 120) doc.addPage();
      doc.moveDown(0.8);
      const hY = doc.y;
      doc.save().rect(MARGIN, hY, 3, 14).fill(BRAND).restore();
      doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text(node.text, MARGIN + 10, hY, { width: CONTENT_W - 10 });
      doc.moveDown(0.5);
      continue;
    }

    if (node.type === "p") {
      doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(node.text, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
      doc.moveDown(0.4);
      continue;
    }

    if (node.type === "ul") {
      for (const item of node.items) {
        if (doc.y > doc.page.height - 60) doc.addPage();
        doc.font("Helvetica").fontSize(10).fillColor(TEXT).text(`•  ${item}`, MARGIN + 8, doc.y, { width: CONTENT_W - 8, lineGap: 3 });
        doc.moveDown(0.2);
      }
      doc.moveDown(0.3);
      continue;
    }

    if (node.type === "table") {
      if (doc.y > doc.page.height - 80) doc.addPage();
      const colCount = Math.max(node.headers.length, ...node.rows.map((r) => r.length), 1);
      const colW = Math.floor(CONTENT_W / colCount);
      const colWidths = Array(colCount).fill(colW);

      let ty = doc.y;
      if (node.headers.length) {
        ty += drawTableRow(doc, node.headers, colWidths, MARGIN, ty, true, false);
      }
      for (let i = 0; i < node.rows.length; i++) {
        if (ty > doc.page.height - 60) {
          doc.addPage();
          ty = doc.y;
        }
        ty += drawTableRow(doc, node.rows[i], colWidths, MARGIN, ty, false, i % 2 === 1);
      }
      // Border around table
      doc.save().rect(MARGIN, doc.y, CONTENT_W, ty - doc.y).lineWidth(0.3).strokeColor("#cbd5e1").stroke().restore();
      doc.y = ty;
      doc.moveDown(0.6);
      continue;
    }

    if (node.type === "aside") {
      doc.moveDown(0.5);
      doc.save();
      const asideY = doc.y;
      doc.rect(MARGIN, asideY, CONTENT_W, 1).fill("#e2e8f0");
      doc.restore();
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(node.text, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 });
      continue;
    }
  }

  // Page numbers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.save().rect(0, doc.page.height - 24, PAGE_W, 24).fill("#f8fafc").restore();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(`QualiPilot  •  ${input.title}  •  Page ${i + 1} / ${range.count}`, MARGIN, doc.page.height - 16, { width: CONTENT_W, align: "center" });
  }

  doc.end();
  return done;
}

export function pdfResponse(buffer: Buffer, filename: string) {
  const body = new Uint8Array(buffer.length);
  body.set(buffer);
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
