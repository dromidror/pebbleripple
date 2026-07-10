const { app } = require("@azure/functions");
const nodemailer = require("nodemailer");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

app.http("sendEmail", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "contact/send",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") {
      return { status: 204, headers: CORS_HEADERS };
    }

    try {
      const SMTP_HOST = process.env.SMTP_HOST || "";
      const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
      const SMTP_USER = process.env.SMTP_USER || "";
      const SMTP_PASS = process.env.SMTP_PASS || "";
      const CONTACT_TO = process.env.CONTACT_TO || "info@pebbleripples.com";

      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return { status: 500, headers: CORS_HEADERS, jsonBody: { error: "Email service not configured" } };
      }

      const body = await request.json();
      const { name, email, message } = body || {};

      if (!name || !email || !message) {
        return { status: 400, headers: CORS_HEADERS, jsonBody: { error: "Missing required fields: name, email, message" } };
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { status: 400, headers: CORS_HEADERS, jsonBody: { error: "Invalid email address" } };
      }

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Pebble Ripple Website" <${SMTP_USER}>`,
        to: CONTACT_TO,
        replyTo: email,
        subject: `Contact Form: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      });

      return {
        headers: CORS_HEADERS,
        jsonBody: { success: true, message: "Email sent successfully" },
      };
    } catch (error) {
      return { status: 500, headers: CORS_HEADERS, jsonBody: { error: error.message || String(error) } };
    }
  },
});
