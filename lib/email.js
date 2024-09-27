const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Read environment variables for email credentials
const email_user = process.env.EMAIL_USER;
const email_password = process.env.EMAIL_PASSWORD;

// Create a transporter using SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS (not SSL)
  auth: {
    user: email_user,
    pass: email_password,
  },
});

// Read HTML email file and replace placeholders
const getHtmlTemplate = (filePath, replacements) => {
  let html = fs.readFileSync(filePath, "utf-8");

  // Replace placeholders dynamically
  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = new RegExp(`\\[${key}\\]`, "g"); // Match placeholder
    html = html.replace(placeholder, value);
  }

  return html;
};

//Send emails function
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: "jibli.salaa@gmail.com",
    to,
    subject,
    html: text,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendEmail;
