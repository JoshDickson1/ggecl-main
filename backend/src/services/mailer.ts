import nodeMailer, { Transporter } from "nodemailer";
import { envConfig } from "../config/envValidator.js";

// export const transporter: Transporter = nodeMailer.createTransport({
//   host: envConfig.smtpHost,
//   port: 465,
//   auth: {
//     user: envConfig.smtpUser,
//     pass: envConfig.smtpPass,
//   },
// });

export const transporter: Transporter = nodeMailer.createTransport({
  service: "SendGrid",
  auth: {
    user: "apikey", // DO NOT change this
    pass: envConfig.sendGridApiKey,
  },
});
