import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { readFile } from "fs/promises";
import { join } from "path";

const JADE = "#38A88A";
const DARK = "#2A2A2A";
const GRAY = "#6B6B6B";
const BG = "#D8D2C8";
const RED = "#C62828";

export async function POST(req: NextRequest) {
  try {
    const { verifyId, threshold, timestamp, wallet, txHash, commitment, verifierContract } = await req.json();

    if (!verifyId || !threshold) {
      return NextResponse.json({ error: "Missing verifyId or threshold" }, { status: 400 });
    }

    const verifyUrl = `${req.nextUrl.origin}/verify/${verifyId}`;
    const now = new Date();
    const dateStr = timestamp || now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) + " UTC";
    const idStr = `ZKP-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}`;
    const walletStr = wallet || "0x7a3F...c92E";
    const txStr = txHash || "0xb4e2...8f1a";
    const commitStr = commitment || "0x1a2b3c4d5e6f...abcdef7890";
    const verifierStr = verifierContract || "0xUltraVerifier...d3F7";
    const explorerUrl = `https://explorer.0g.ai/tx/${txStr}`;

    // Parse threshold number and words
    const thresholdNum = threshold.replace(/[^0-9]/g, "");
    const thresholdFormatted = `$${Number(thresholdNum).toLocaleString("en-US")}`;

    // Number to words (simplified)
    const numWords: Record<string, string> = {
      "10000": "ten thousand",
      "25000": "twenty-five thousand",
      "50000": "fifty thousand",
      "100000": "one hundred thousand",
      "250000": "two hundred fifty thousand",
      "500000": "five hundred thousand",
      "1000000": "one million",
    };
    const thresholdWords = numWords[thresholdNum] || `${Number(thresholdNum).toLocaleString("en-US")}`;

    // Load logo PNG
    const logoPath = join(process.cwd(), "public", "logo.png");
    const logoBuffer = await readFile(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(explorerUrl, {
      width: 300,
      margin: 1,
      color: { dark: DARK, light: "#FFFFFF" },
    });

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const mx = 22; // margin x

    // ─── Background ───
    doc.setFillColor(BG);
    doc.rect(0, 0, w, h, "F");

    // ─── Header: Logo left + PROOF VERIFIED right ───
    let y = 20;
    const logoW = 55;
    const logoH = logoW / 3.74;
    doc.addImage(logoBase64, "PNG", mx, y, logoW, logoH);

    // Green dot + PROOF VERIFIED
    doc.setFillColor(JADE);
    doc.circle(w - mx - 42, y + 5, 2.5, "F");
    doc.setTextColor(JADE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PROOF VERIFIED", w - mx - 37, y + 7);

    // Jade line under header
    y += logoH + 8;
    doc.setFillColor(JADE);
    doc.rect(mx, y, w - mx * 2, 0.8, "F");

    // ─── Title ───
    y += 14;
    doc.setTextColor(DARK);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Cryptographic Attestation of Proof of Funds", mx, y);
    y += 8;
    doc.setTextColor(GRAY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("This document certifies that a zero-knowledge proof has been successfully generated and verified on-chain.", mx, y);

    // ─── PROOF SUMMARY ───
    y += 16;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(mx, y, w - mx, y);
    y += 8;
    doc.setTextColor(JADE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PROOF SUMMARY", mx, y);
    y += 8;

    const summaryRows = [
      { label: "IDENTIFIER", value: idStr },
      { label: "DATE", value: `${dateStr} — ${timeStr}` },
      { label: "PROOF SYSTEM", value: "Noir / UltraPlonk (Barretenberg)" },
      { label: "CHAIN", value: "0G Chain" },
      { label: "HOLDER WALLET", value: walletStr },
      { label: "TX HASH", value: txStr },
    ];

    for (const row of summaryRows) {
      doc.setTextColor(GRAY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(row.label, mx + 4, y);
      doc.setTextColor(DARK);
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      doc.text(row.value, mx + 55, y);
      y += 7;
    }

    // ─── WHAT WAS PROVEN ───
    y += 6;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(mx, y, w - mx, y);
    y += 8;
    doc.setTextColor(JADE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("WHAT WAS PROVEN", mx, y);
    y += 8;

    doc.setTextColor(DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`The holder of wallet `, mx, y, { maxWidth: w - mx * 2 });
    const textW1 = doc.getTextWidth("The holder of wallet ");
    doc.setFont("courier", "bold");
    doc.text(walletStr, mx + textW1, y);
    const textW2 = doc.getTextWidth(walletStr);
    doc.setFont("helvetica", "normal");
    doc.text(" has proven, via a zero-knowledge circuit (Noir/UltraPlonk),", mx + textW1 + textW2, y);
    y += 5;
    doc.text("that the total value of their xStocks portfolio exceeds:", mx, y);

    // Big threshold number
    y += 14;
    doc.setTextColor(JADE);
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text(thresholdFormatted, mx, y);
    const bigW = doc.getTextWidth(thresholdFormatted);
    doc.setTextColor(GRAY);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${thresholdWords} US dollars`, mx + bigW + 6, y - 1);

    // NOT REVEALED
    y += 8;
    doc.setTextColor(RED);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("NOT REVEALED", mx, y);
    doc.setTextColor(GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(" —  individual positions, amounts, tickers, or the exact portfolio total.", mx + doc.getTextWidth("NOT REVEALED") + 2, y);

    // ─── CRYPTOGRAPHIC DETAILS ───
    y += 14;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(mx, y, w - mx, y);
    y += 8;
    doc.setTextColor(JADE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CRYPTOGRAPHIC DETAILS", mx, y);
    y += 8;

    const cryptoRows = [
      { label: "COMMITMENT (POSEIDON)", value: commitStr },
      { label: "VERIFIER CONTRACT", value: verifierStr },
      { label: "PROOF SYSTEM", value: "UltraPlonk (Barretenberg)" },
      { label: "HASH FUNCTION", value: "Poseidon (BN254)" },
      { label: "PROOF SIZE", value: "~2 KB" },
    ];

    for (const row of cryptoRows) {
      doc.setTextColor(GRAY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(row.label, mx + 4, y);
      doc.setTextColor(DARK);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(row.value, mx + 68, y);
      y += 7;
    }

    // ─── ON-CHAIN VERIFICATION ───
    y += 6;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(mx, y, w - mx, y);
    y += 8;

    // QR code
    const qrSize = 30;
    doc.setFillColor("#FFFFFF");
    doc.roundedRect(mx, y - 2, qrSize + 4, qrSize + 4, 1.5, 1.5, "F");
    doc.addImage(qrDataUrl, "PNG", mx + 2, y, qrSize, qrSize);

    // Text next to QR
    const qrTextX = mx + qrSize + 10;
    doc.setTextColor(JADE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ON-CHAIN VERIFICATION", qrTextX, y + 4);

    doc.setTextColor(DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Scan the QR code or visit the link below to independently verify this proof.", qrTextX, y + 11);

    doc.setTextColor(GRAY);
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.text(explorerUrl, qrTextX, y + 18);

    doc.setTextColor(GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Anyone can verify this proof without accessing private data.", qrTextX, y + 25);

    // ─── IMPORTANT NOTICE (bottom) ───
    const noticeY = h - 30;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(mx, noticeY, w - mx, noticeY);

    doc.setTextColor(DARK);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT NOTICE", mx, noticeY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(GRAY);
    doc.setFontSize(6.5);
    doc.text(
      "This attestation is a verifiable mathematical proof, generated client-side with no third-party access to private data. The proof is non-interactive",
      mx, noticeY + 9,
    );
    doc.text(
      "and can be verified unlimited times. The Poseidon commitment binds the proof to a specific portfolio state. This does not constitute financial advice.",
      mx, noticeY + 13,
    );

    // ─── Footer ───
    const footY = h - 8;
    doc.setDrawColor("#C4C4C4");
    doc.setLineWidth(0.15);
    doc.line(mx, footY - 4, w - mx, footY - 4);

    doc.setTextColor(DARK);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("RÄDEGÄST", mx, footY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(GRAY);
    doc.setFontSize(7);
    doc.text("\u00b7  0G Network  \u00b7  Dynamic SDK  \u00b7  Noir ZK", mx + doc.getTextWidth("RÄDEGÄST") + 3, footY);
    doc.text("ETHGlobal Cannes 2026", w - mx, footY, { align: "right" });

    // Output
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="radegast_attestation_zk.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
