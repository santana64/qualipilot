import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  navy:    "#0f172a",
  brand:   "#2563eb",
  accent:  "#3b82f6",
  muted:   "#64748b",
  faint:   "#94a3b8",
  border:  "#e2e8f0",
  row_alt: "#f8fafc",
  white:   "#ffffff",
  text:    "#1e293b",
  aside:   "#f1f5f9",
};

// ─── Page geometry ───────────────────────────────────────────────────────────
const PW   = 595.28;   // A4 width  (pt)
const PH   = 841.89;   // A4 height (pt)
const ML   = 52;       // left margin
const MR   = 52;       // right margin
const MT   = 52;       // top margin (after cover)
const MB   = 48;       // bottom margin
const CW   = PW - ML - MR;  // content width

// ─── HTML helpers ────────────────────────────────────────────────────────────
function decode(s: string) {
  return s
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function plain(html: string) {
  return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

// ─── AST ─────────────────────────────────────────────────────────────────────
type Node =
  | { t: "cover";  title: string; org: string; date: string }
  | { t: "h2";     text: string }
  | { t: "p";      text: string }
  | { t: "ul";     items: string[] }
  | { t: "table";  cols: string[]; rows: string[][] }
  | { t: "aside";  text: string };

function parse(html: string): Node[] {
  const nodes: Node[] = [];

  // cover meta
  const h1m   = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const orgm  = /Organisme<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i.exec(html);
  const datem = /Date de g[eé]n[eé]ration[^<]*<\/strong>\s*([\s\S]*?)<\/p>/i.exec(html);
  nodes.push({
    t:     "cover",
    title: h1m  ? plain(h1m[1])  : "Document",
    org:   orgm  ? plain(orgm[1]) : "",
    date:  datem ? plain(datem[1]): new Date().toLocaleDateString("fr-FR"),
  });

  // sections
  const secRe = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = secRe.exec(html)) !== null) {
    const sec = sm[1];

    const h2m = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(sec);
    if (h2m) nodes.push({ t: "h2", text: plain(h2m[1]) });

    // table
    const tm = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(sec);
    if (tm) {
      const thead = /<thead[^>]*>([\s\S]*?)<\/thead>/i.exec(tm[1]);
      const tbody = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(tm[1]);
      const cols: string[] = [];
      const rows: string[][] = [];
      if (thead) {
        for (const th of (thead[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) ?? [])) cols.push(plain(th));
      }
      if (tbody) {
        for (const tr of (tbody[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) ?? [])) {
          rows.push((tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? []).map(plain));
        }
      }
      if (cols.length || rows.length) { nodes.push({ t: "table", cols, rows }); continue; }
    }

    // ul
    const um = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(sec);
    if (um) {
      const items = (um[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? []).map(plain);
      nodes.push({ t: "ul", items }); continue;
    }

    // p
    for (const pm of (sec.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [])) {
      const text = plain(pm);
      if (text) nodes.push({ t: "p", text });
    }
  }

  // aside
  const am = /<aside[^>]*>([\s\S]*?)<\/aside>/i.exec(html);
  if (am) nodes.push({ t: "aside", text: plain(am[1]) });

  return nodes;
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────
type Doc = InstanceType<typeof PDFDocument>;

function hline(doc: Doc, y: number, color = C.border, w = 0.5) {
  doc.save().moveTo(ML, y).lineTo(PW - MR, y).lineWidth(w).strokeColor(color).stroke().restore();
}

function drawRunningHeader(doc: Doc, title: string, page: number, total: number) {
  const y = 18;
  doc.save()
    .rect(0, 0, PW, 36).fill(C.navy)
    .font("Helvetica-Bold").fontSize(8).fillColor(C.white)
    .text("QualiPilot", ML, y, { width: 80 })
    .font("Helvetica").fontSize(8).fillColor(C.faint)
    .text(title.length > 60 ? title.slice(0, 58) + "…" : title, ML + 85, y, { width: CW - 160 })
    .text(`${page} / ${total}`, ML, y, { width: CW, align: "right" })
    .restore();
}

function drawFooter(doc: Doc) {
  const y = PH - 22;
  hline(doc, y - 4, C.border);
  doc.font("Helvetica").fontSize(7.5).fillColor(C.faint)
    .text("Document généré par QualiPilot — usage interne — ne constitue pas une validation officielle", ML, y, { width: CW, align: "center" });
}

function needsPage(doc: Doc, needed = 80) {
  if (doc.y + needed > PH - MB - 36) { doc.addPage(); doc.y = MT + 36; }
}

// Estimate text height: avg Helvetica char ≈ 0.52× fontSize
function textH(text: string, width: number, fontSize: number) {
  const charsPerLine = Math.max(1, Math.floor(width / (fontSize * 0.52)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * fontSize * 1.35;
}

function drawTable(doc: Doc, cols: string[], rows: string[][], startY: number): number {
  const n      = Math.max(cols.length, ...rows.map((r) => r.length), 1);
  // First col slightly wider for key/value tables
  const col0W  = n === 2 ? Math.round(CW * 0.38) : Math.floor(CW / n);
  const colW   = (i: number) => i === 0 ? col0W : Math.floor((CW - col0W) / (n - 1));
  const PAD    = 5;

  let y = startY;

  // header row
  if (cols.length) {
    const rh = Math.max(20, ...cols.map((c, i) => textH(c, colW(i) - PAD * 2, 8) + PAD * 2));
    doc.save().rect(ML, y, CW, rh).fill(C.brand).restore();
    let x = ML;
    for (let i = 0; i < n; i++) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white)
        .text(cols[i] ?? "", x + PAD, y + PAD, { width: colW(i) - PAD * 2, lineGap: 1.5 });
      x += colW(i);
    }
    y += rh;
  }

  // data rows
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rh  = Math.max(18, ...row.map((c, i) => textH(c, colW(i) - PAD * 2, 9) + PAD * 2));

    if (y + rh > PH - MB - 36) {
      doc.addPage();
      y = MT + 36;
      // repeat header on new page
      if (cols.length) {
        const hh = Math.max(20, ...cols.map((c, i) => textH(c, colW(i) - PAD * 2, 8) + PAD * 2));
        doc.save().rect(ML, y, CW, hh).fill(C.brand).restore();
        let x = ML;
        for (let i = 0; i < n; i++) {
          doc.font("Helvetica-Bold").fontSize(8).fillColor(C.white)
            .text(cols[i] ?? "", x + PAD, y + PAD, { width: colW(i) - PAD * 2, lineGap: 1.5 });
          x += colW(i);
        }
        y += hh;
      }
    }

    const bg = r % 2 === 0 ? C.white : C.row_alt;
    doc.save().rect(ML, y, CW, rh).fill(bg).restore();

    let x = ML;
    for (let i = 0; i < n; i++) {
      doc.font(i === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(C.text)
        .text(row[i] ?? "", x + PAD, y + PAD, { width: colW(i) - PAD * 2, lineGap: 2 });
      x += colW(i);
    }
    y += rh;
  }

  // outer border
  doc.save().rect(ML, startY, CW, y - startY).lineWidth(0.4).strokeColor(C.border).stroke().restore();
  return y;
}

// ─── Cover page ───────────────────────────────────────────────────────────────
function drawCover(doc: Doc, title: string, org: string, date: string) {
  // Top band
  doc.save().rect(0, 0, PW, 220).fill(C.navy).restore();

  // Brand label
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.accent)
    .text("QualiPilot", ML, 52, { width: CW });

  // Title
  doc.font("Helvetica-Bold").fontSize(28).fillColor(C.white)
    .text(title, ML, 80, { width: CW, lineGap: 6 });

  // Thin accent line
  const lineY = doc.y + 16;
  doc.save().rect(ML, lineY, 60, 3).fill(C.accent).restore();

  // Meta block
  const metaY = 240;
  doc.font("Helvetica").fontSize(10).fillColor(C.muted)
    .text("Organisme", ML, metaY);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.navy)
    .text(org || "—", ML, metaY + 14, { width: CW });

  doc.font("Helvetica").fontSize(10).fillColor(C.muted)
    .text("Date de génération", ML, metaY + 44);
  doc.font("Helvetica").fontSize(11).fillColor(C.navy)
    .text(date, ML, metaY + 58);

  // Bottom disclaimer box
  const boxY = PH - 130;
  doc.save().rect(ML, boxY, CW, 80).fill(C.row_alt).restore();
  doc.save().rect(ML, boxY, 3, 80).fill(C.accent).restore();
  doc.font("Helvetica").fontSize(8).fillColor(C.muted)
    .text(
      "Ce document est généré automatiquement par QualiPilot à partir des données saisies dans l'espace qualité. Il constitue une aide à la préparation et ne remplace pas le guide officiel du Référentiel National Qualité, un organisme certificateur ou un conseil qualité personnalisé.",
      ML + 12, boxY + 10,
      { width: CW - 20, lineGap: 3 }
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function renderPdfBuffer(input: { title: string; contentHtml?: string; contentText?: string }) {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, info: { Title: input.title, Author: "QualiPilot", Subject: "Dossier qualité préparatoire Qualiopi" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const html  = input.contentHtml ?? `<p>${decode(input.contentText ?? "")}</p>`;
  const nodes = parse(html);

  let cover: Node & { t: "cover" } = { t: "cover", title: input.title, org: "", date: new Date().toLocaleDateString("fr-FR") };
  const body: Node[] = [];
  for (const n of nodes) {
    if (n.t === "cover") cover = n;
    else body.push(n);
  }

  // ── Page 1 : cover ──────────────────────────────────────────────────────
  drawCover(doc, cover.title, cover.org, cover.date);

  // ── Content pages ────────────────────────────────────────────────────────
  doc.addPage();
  doc.y = MT + 36;  // below running header

  for (const node of body) {
    if (node.t === "h2") {
      needsPage(doc, 60);
      const y = doc.y + 4;
      // Left accent bar
      doc.save().rect(ML, y, 3, 14).fill(C.brand).restore();
      doc.font("Helvetica-Bold").fontSize(13).fillColor(C.navy)
        .text(node.text, ML + 10, y, { width: CW - 10 });
      doc.y += 8;
      hline(doc, doc.y, C.border);
      doc.y += 10;
      continue;
    }

    if (node.t === "p") {
      needsPage(doc, 30);
      doc.font("Helvetica").fontSize(10).fillColor(C.text)
        .text(node.text, ML, doc.y, { width: CW, lineGap: 3 });
      doc.y += 8;
      continue;
    }

    if (node.t === "ul") {
      for (const item of node.items) {
        needsPage(doc, 20);
        const bY = doc.y + 4.5;
        doc.save().circle(ML + 5, bY, 2).fill(C.accent).restore();
        doc.font("Helvetica").fontSize(10).fillColor(C.text)
          .text(item, ML + 14, doc.y, { width: CW - 14, lineGap: 2 });
        doc.y += 4;
      }
      doc.y += 6;
      continue;
    }

    if (node.t === "table") {
      needsPage(doc, 60);
      const endY = drawTable(doc, node.cols, node.rows, doc.y);
      doc.y = endY + 14;
      continue;
    }

    if (node.t === "aside") {
      needsPage(doc, 50);
      doc.y += 8;
      const aY = doc.y;
      const aH = textH(node.text, CW - 24, 8) + 20;
      doc.save().rect(ML, aY, CW, aH).fill(C.row_alt).restore();
      doc.save().rect(ML, aY, 3, aH).fill(C.faint).restore();
      doc.font("Helvetica").fontSize(8).fillColor(C.muted)
        .text(node.text, ML + 12, aY + 10, { width: CW - 24, lineGap: 3 });
      doc.y = aY + aH + 10;
      continue;
    }
  }

  // ── Running headers + footers ────────────────────────────────────────────
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = range.start; i < range.start + total; i++) {
    doc.switchToPage(i);
    if (i === range.start) continue; // cover has no running header
    drawRunningHeader(doc, cover.title, i, total - 1);
    drawFooter(doc);
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
