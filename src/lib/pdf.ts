import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ProjectBundle } from "@/lib/domain";
import { project } from "@/lib/finance";
import { isMostlyRtl, toVisualRtl } from "@/lib/bidi";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;

function logicalLines(text: string) {
  return text.replace(/\r/g, "").split("\n");
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of logicalLines(text)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = words[0];
    for (const word of words.slice(1)) {
      const next = `${current} ${word}`;
      if (font.widthOfTextAtSize(next, size) > width) {
        lines.push(current);
        current = word;
      } else current = next;
    }
    lines.push(current);
  }
  return lines;
}

export async function renderPdf(title: string, blocks: { heading?: string; body: string }[], rtl: boolean) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(fs.readFileSync(path.join(process.cwd(), "assets/fonts/NotoSansHebrew-Regular.ttf")), { subset: true });
  const bold = await pdf.embedFont(fs.readFileSync(path.join(process.cwd(), "assets/fonts/NotoSansHebrew-Bold.ttf")), { subset: true });
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const draw = (value: string, size: number, font: PDFFont, color = rgb(0.09, 0.1, 0.09)) => {
    const visual = isMostlyRtl(value) ? toVisualRtl(value) : value;
    const width = font.widthOfTextAtSize(visual, size);
    const x = rtl ? PAGE_W - MARGIN - width : MARGIN;
    page.drawText(visual, { x, y, size, font, color });
  };
  const ensure = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };
  ensure(36);
  draw(title, 20, bold);
  y -= 32;
  for (const block of blocks) {
    if (block.heading) {
      ensure(28);
      draw(block.heading, 13, bold);
      y -= 20;
    }
    for (const line of wrap(regular, block.body, 10.5, PAGE_W - MARGIN * 2)) {
      ensure(16);
      if (line) draw(line, 10.5, regular, rgb(0.2, 0.22, 0.2));
      y -= line ? 15 : 8;
    }
    y -= 8;
  }
  return pdf.save();
}

export async function businessPlanPdf(bundle: ProjectBundle) {
  const rtl = bundle.profile.locale === "he";
  return renderPdf(bundle.name, [
    { body: bundle.analysis.disclaimer },
    { heading: rtl ? "רעיון" : "Idea", body: bundle.idea },
    ...bundle.plan.map((section) => ({ heading: section.title, body: section.content })),
  ], rtl);
}

export async function brandPdf(bundle: ProjectBundle) {
  const rtl = bundle.profile.locale === "he";
  const blocks = bundle.brands.flatMap((brand) => [
    {
      heading: `${brand.title} · ${brand.chosenName}`,
      body: [brand.summary, brand.tagline, brand.positioning, brand.personality.join(", "), brand.voice.join("\n"), brand.colors.map((color) => `${color.name} ${color.hex}`).join("\n"), `${brand.fonts.heading} / ${brand.fonts.body}`, brand.trademarkNote].join("\n\n"),
    },
  ]);
  const pdfBytes = await renderPdf(rtl ? `${bundle.name} · כיווני מותג` : `${bundle.name} · brand directions`, blocks, rtl);
  const pdf = await PDFDocument.load(pdfBytes);
  const page = pdf.getPages()[0] as PDFPage;
  bundle.brands.slice(0, 3).forEach((brand, index) => {
    brand.colors.slice(0, 4).forEach((color, colorIndex) => {
      const hex = color.hex.replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      if ([r, g, b].some((channel) => Number.isNaN(channel))) return;
      page.drawRectangle({ x: MARGIN + colorIndex * 18, y: 72 - index * 16, width: 14, height: 10, color: rgb(r, g, b) });
    });
  });
  return pdf.save();
}

export function financeNarrative(bundle: ProjectBundle) {
  return bundle.scenarios.map((scenario) => {
    const result = project(scenario.assumptions);
    return {
      heading: scenario.name,
      body: `${scenario.assumptions.notes}\nprice ${scenario.assumptions.price}\nstartup ${result.startupTotal}\nmonthly ${result.monthlyFixed}\nbreak-even customers ${result.breakEvenCustomers ?? "n/a"}\nbreak-even month ${result.breakEvenMonth ?? "n/a"}\nending cash ${result.endingCash}`,
    };
  });
}
