import transporter from '../config/transporter.config.js';
import config from '../config/config.js';

const mailSender = async options => {
  await transporter.sendMail({
    from: config.SENDER_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.text,
  });
};

export default mailSender;
