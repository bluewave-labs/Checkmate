import nodemailer from "nodemailer";

export class EmailService implements IEmailService {
  private transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendEmail(email: string, subject: string, body: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject,
      html: body,
    });

    console.log("✅ Email sent to:", email);
  }
}