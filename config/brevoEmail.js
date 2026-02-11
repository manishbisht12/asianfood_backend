import axios from "axios";

export const sendOtpEmail = async (toEmail, otp) => {
  const url = "https://api.brevo.com/v3/smtp/email";

  const data = {
    sender: {
      name: process.env.BREVO_SENDER_NAME,
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: "Your OTP for Signup",
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing:3px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you didn’t request thpris, please ignore.</p>
      </div>
    `,
  };

  await axios.post(url, data, {
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
  });
};
