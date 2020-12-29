import sgMail from '@sendgrid/mail';

import config from './config';

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

sgMail.setApiKey(config.SENDGRID_API_KEY);

export default {
  send: async function send(to, options) {
    if (!options) throw new Error('email.send requires subject and content');

    const { subject, text, html } = options;

    const emailConfig = {
      from: {
        email: config.EMAIL_FROM,
        name: config.EMAIL_FROMNAME,
      },
      to,
      subject,
      text,
      html,
    };

    return await sgMail.send(emailConfig);
  },
};
