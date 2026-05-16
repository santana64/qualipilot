import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

function htmlToText(html: string) {
  return html
    .replace(/<h1[^>]*>/gi, "\n# ")
    .replace(/<h2[^>]*>/gi, "\n\n## ")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<t[hd][^>]*>/gi, "  ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n\s+\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function renderPdfBuffer(input: {
  title: string;
  contentHtml?: string;
  contentText?: string;
}) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    bufferPages: true,
    info: {
      Title: input.title,
      Author: "QualiPilot",
      Subject: "Dossier qualite preparatoire",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.font("Helvetica-Bold").fontSize(20).fillColor("#0f172a").text(input.title, { lineGap: 6 });
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(`Genere par QualiPilot - ${new Date().toLocaleDateString("fr-FR")}`);
  doc.moveDown();

  const text = input.contentText || htmlToText(input.contentHtml || "");
  for (const rawBlock of text.split(/\n{2,}/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    if (block.startsWith("# ")) {
      doc.moveDown(0.6).font("Helvetica-Bold").fontSize(18).fillColor("#0f172a").text(block.slice(2), { lineGap: 4 });
    } else if (block.startsWith("## ")) {
      doc.moveDown(0.7).font("Helvetica-Bold").fontSize(13).fillColor("#0f172a").text(block.slice(3), { lineGap: 3 });
    } else {
      const lines = block.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("- ")) {
          doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`• ${trimmed.slice(2)}`, {
            indent: 12,
            lineGap: 3,
          });
        } else {
          doc.font("Helvetica").fontSize(10).fillColor("#334155").text(trimmed, { lineGap: 4 });
        }
      }
      doc.moveDown(0.4);
    }
  }

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text(`QualiPilot - page ${index + 1}/${range.count}`, 48, doc.page.height - 36, {
      align: "center",
      width: doc.page.width - 96,
    });
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
