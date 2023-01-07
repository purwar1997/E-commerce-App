import config from '../config/config';
import transporter from '../config/transporter';

const mailSender = async options => {
  await transporter.sendMail({
    from: config.SMTP_SENDER_EMAIL, // sender address
    to: options.email, // receiver address
    subject: options.subject, // subject line
    text: options.text, // plain text body
  });
};

export default mailSender;
