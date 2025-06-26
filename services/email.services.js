import {
  VERIFICATION_EMAIL_TEMPLATE
} from "../templates/email.template.js";
import { transporter } from "../utils/nodemailer.utils.js";

export const sendVerificationCode = async (email, verificationCode) => {
  try {
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "URL Shortener, Email Verification",
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationCode),
    };
    const success = await transporter.sendMail(mailOptions);
    return success;
  } catch (error) {
    console.log(error)
    return false;
  }
};