import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: process.env.PORT || 4000,
  MONGODB_URL: process.env.MONGODB_URL,
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  TOKEN_EXPIRES_IN: process.env.TOKEN_EXPIRES_IN || '2d',
  SMTP_MAIL_HOST: process.env.SMTP_MAIL_HOST,
  SMTP_MAIL_PORT: process.env.SMTP_MAIL_PORT,
  SMTP_MAIL_USERNAME: process.env.SMTP_MAIL_USERNAME,
  SMTP_MAIL_PASSWORD: process.env.SMTP_MAIL_PASSWORD,
  SMTP_SENDER_EMAIL: process.env.SMTP_SENDER_EMAIL,
};

export default config;