import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function check() {
  const data = await resend.emails.send({
    from: process.env.FROM_EMAIL || "BrainExpo <onboarding@resend.dev>",
    to: "divyamjha54@gmail.com",
    subject: "Test API Error",
    html: "<p>Does this deliver?</p>"
  });
  console.log(data);
  process.exit(0);
}
check();
