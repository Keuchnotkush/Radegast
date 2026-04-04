import express from "express";
import cors from "cors";
import { createTransport } from "nodemailer";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// ── Mail transporter ──
const mailer = createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Health ──
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Send email ──
app.post("/api/email/send", async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "to, subject, and html are required" });
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ── Welcome email (after signup) ──
app.post("/api/email/welcome", async (req, res) => {
  const { to, name } = req.body;
  if (!to || !name) {
    return res.status(400).json({ error: "to and name are required" });
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "Welcome to Radegast",
      html: `
        <div style="font-family:Sora,sans-serif;color:#2A2A2A">
          <h2>Welcome, ${name}!</h2>
          <p>Your portfolio is ready. Start investing in tokenized US stocks — 24/7, from anywhere.</p>
          <p style="margin-top:24px">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard"
               style="background:#38A88A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Open Dashboard
            </a>
          </p>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Welcome email error:", err.message);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

// ── In-memory user store ──
const users = new Map();

// ── Register user (called on signup) ──
app.post("/api/user/register", (req, res) => {
  const { email, firstName, lastName } = req.body;
  if (!email || !firstName) {
    return res.status(400).json({ error: "email and firstName are required" });
  }
  const id = Buffer.from(email).toString("base64url");
  const user = { id, email, firstName, lastName: lastName || "", strategy: null, aiMode: "Advisory", createdAt: Date.now() };
  users.set(id, user);
  users.set(email, user); // index by email too
  res.json({ success: true, user });
});

// ── Get user by id or email ──
app.get("/api/user/:key", (req, res) => {
  const user = users.get(req.params.key);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// ── Update user (strategy, aiMode, etc.) ──
app.patch("/api/user/:key", (req, res) => {
  const user = users.get(req.params.key);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  Object.assign(user, req.body);
  res.json({ success: true, user });
});

app.listen(PORT, () => {
  console.log(`  ⚡ radegast backend — http://localhost:${PORT}`);
});
