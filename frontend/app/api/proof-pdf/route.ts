import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { readFile } from "fs/promises";
import { join } from "path";

const JADE = "#38A88A";
const DARK = "#2A2A2A";
const GRAY = "#6B6B6B";
const BG = "#D8D2C8";

export async function POST(req: NextRequest) {
  try {
    const { verifyId, threshold, timestamp } = await req.json();

    if (!verifyId || !threshold) {
      return NextResponse.json({ error: "Missing verifyId or threshold" }, { status: 400 });
    }

    const verifyUrl = `${req.nextUrl.origin}/verify/${verifyId}`;

    // Load logo PNG
    const logoPath = join(process.cwd(), "public", "logo.png");
    const logoBuffer = await readFile(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      color: { dark: DARK, light: "#FFFFFF" },
    });

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // ─── Background (same taupe as website) ───
    doc.setFillColor(BG);
    doc.rect(0, 0, w, h, "F");

    // ─── Header band ───
    doc.setFillColor(DARK);
    doc.rect(0, 0, w, 52, "F");

    // Logo (real PNG, aspect ratio 4000:1070 ≈ 3.74:1)
    const logoW = 62;
    const logoH = logoW / 3.74;
    doc.addImage(logoBase64, "PNG", 20, 12, logoW, logoH);

    // Certificate label right side
    doc.setTextColor("#FFFFFF");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PROOF OF SOLVENCY", w - 20, 20, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#FFFFFF80");
    doc.text(timestamp || new Date().toISOString().split("T")[0], w - 20, 27, { align: "right" });

    // Thin jade accent line under header
    doc.setFillColor(JADE);
    doc.rect(0, 52, w, 1.2, "F");

    // ─── Status section ───
    let y = 72;

    // Checkmark circle (drawn, not unicode)
    doc.setFillColor(JADE);
    doc.circle(32, y, 9, "F");
    // Draw checkmark as lines
    doc.setDrawColor("#FFFFFF");
    doc.setLineWidth(1.2);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.line(27.5, y + 0.5, 30.5, y + 3.5); // short stroke
    doc.line(30.5, y + 3.5, 37, y - 3.5);    // long stroke

    doc.setTextColor(JADE);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Portfolio Verified", 48, y + 1);
    doc.setTextColor(DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Exceeds ${threshold}`, 48, y + 9);

    // ─── Separator ───
    y += 24;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.2);
    doc.line(20, y, w - 20, y);

    // ─── Details — 2-column grid ───
    y += 10;
    const leftX = 20;
    const rightX = w / 2 + 5;

    const detailRows = [
      [
        { label: "VERIFICATION ID", value: verifyId },
        { label: "THRESHOLD", value: threshold },
      ],
      [
        { label: "CIRCUIT", value: "UltraPlonk" },
        { label: "PROVER", value: "noir.js (WASM)" },
      ],
      [
        { label: "CHAIN", value: "0G Chain" },
        { label: "TIMESTAMP", value: timestamp || new Date().toLocaleString() },
      ],
    ];

    for (const row of detailRows) {
      for (let col = 0; col < row.length; col++) {
        const x = col === 0 ? leftX : rightX;
        const d = row[col];
        doc.setTextColor(GRAY);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(d.label, x, y);
        doc.setTextColor(DARK);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        // Truncate long values
        const val = d.value.length > 38 ? d.value.slice(0, 38) + "..." : d.value;
        doc.text(val, x, y + 5.5);
      }
      y += 16;
    }

    // ─── Separator ───
    y += 2;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.2);
    doc.line(20, y, w - 20, y);
    y += 10;

    // ─── QR Code section ───
    doc.setTextColor(DARK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Scan to verify", 20, y);
    doc.setTextColor(GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Anyone can verify this proof — no account needed.", 20, y + 6);

    // QR with white background card
    const qrX = 20;
    const qrY = y + 11;
    const qrSize = 38;
    doc.setFillColor("#FFFFFF");
    doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // URL next to QR
    doc.setTextColor(JADE);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const urlX = qrX + qrSize + 10;
    doc.text("Verification URL", urlX, qrY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(DARK);
    // Split URL if long
    const urlLines = doc.splitTextToSize(verifyUrl, w - urlX - 20);
    doc.text(urlLines, urlX, qrY + 16);

    // Verify ID as copyable text
    doc.setTextColor(GRAY);
    doc.setFontSize(7);
    doc.text("Verify ID", urlX, qrY + 30);
    doc.setTextColor(DARK);
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text(verifyId, urlX, qrY + 35);

    // ─── Privacy notice ───
    y = qrY + qrSize + 14;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.2);
    doc.line(20, y, w - 20, y);
    y += 8;

    // Privacy box with subtle jade tint
    doc.setFillColor(214, 232, 225); // light jade tint that works on taupe bg
    doc.roundedRect(20, y, w - 40, 24, 2, 2, "F");

    // Shield icon (drawn)
    const sx = 28;
    const sy = y + 7;
    doc.setDrawColor(JADE);
    doc.setLineWidth(0.6);
    doc.setFillColor(JADE);
    doc.circle(sx, sy, 3, "D");

    doc.setTextColor(DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Privacy guarantee", 34, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(GRAY);
    doc.setFontSize(7.5);
    doc.text("This certificate proves the portfolio exceeds the stated threshold.", 34, y + 14);
    doc.text("No holdings, share counts, total value, or wallet address are ever revealed.", 34, y + 19);

    // ─── Footer ───
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(20, h - 14, w - 20, h - 14);
    doc.setTextColor(GRAY);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Radegast  \u00b7  ETHGlobal Cannes 2026  \u00b7  radegast.app", w / 2, h - 8, { align: "center" });

    // Output
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="radegast-proof-${verifyId.slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
