const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const recentRequests = new Map();
const MAX_REQUESTS_PER_HOUR = 6;
const ONE_HOUR_MS = 60 * 60 * 1000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", true);

app.use(express.static(path.join(__dirname, "public")));

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isRateLimited(ip) {
  const now = Date.now();
  const history = recentRequests.get(ip) || [];
  const freshHistory = history.filter((timestamp) => now - timestamp < ONE_HOUR_MS);

  freshHistory.push(now);
  recentRequests.set(ip, freshHistory);

  return freshHistory.length > MAX_REQUESTS_PER_HOUR;
}

async function sendContactEmail({ name, email, phone, service, message }) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    CONTACT_TO_EMAIL,
    CONTACT_FROM_EMAIL
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !CONTACT_TO_EMAIL ||
    !CONTACT_FROM_EMAIL
  ) {
    throw new Error("Missing SMTP or contact email environment variables.");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  const subject = `New Digital Pier lead: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Service: ${service}`,
    "",
    "Message:",
    message
  ].join("\n");

  await transporter.sendMail({
    to: CONTACT_TO_EMAIL,
    from: CONTACT_FROM_EMAIL,
    replyTo: email,
    subject,
    text
  });
}

app.post("/api/contact", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({
      ok: false,
      message: "Too many requests. Please try again in about an hour."
    });
  }

  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim();
  const phone = String(req.body.phone || "").trim();
  const service = String(req.body.service || "").trim();
  const message = String(req.body.message || "").trim();
  const companyWebsite = String(req.body.companyWebsite || "").trim();

  if (companyWebsite) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !service || !message) {
    return res.status(400).json({
      ok: false,
      message: "Please fill out all required fields."
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      ok: false,
      message: "Please enter a valid email address."
    });
  }

  try {
    await sendContactEmail({ name, email, phone, service, message });
    return res.status(200).json({
      ok: true,
      message: "Message sent. We will get back to you shortly."
    });
  } catch (error) {
    console.error("Contact form send failed:", error.message);
    return res.status(500).json({
      ok: false,
      message: "Unable to send right now. Please email hello@digitalpier.dev."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Digital Pier site running on port ${PORT}`);
});
