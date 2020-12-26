import gql from 'graphql-tag';

import config from 'src/server/config';
import serverEmail from 'src/server/email';
import loginConfirmEmail from 'src/server/emailTemplates/loginConfirmEmail';
import words from 'src/server/words';

// {
//   "event": {
//       "session_variables": {
//           "x-hasura-role": "admin"
//       },
//       "op": "INSERT",
//       "data": {
//           "old": null,
//           "new": {
//               "created": "2020-12-21T12:47:31.384155+00:00",
//               "expires": "2020-12-25T12:02:34.479+00:00",
//               "value": "a",
//               "userId": "7f708d1c-0e5e-4ded-a4df-3370fbce77c8",
//               "requestCookie": "a",
//               "approved": false,
//               "email": "zzz"
//           }
//       },
//       "trace_context": {
//           "trace_id": 6713204378778393000,
//           "span_id": 3902677332806695000
//       }
//   },
//   "created_at": "2020-12-21T12:47:31.384155Z",
//   "id": "574a0a96-ad23-4005-a377-86251561e5e2",
//   "delivery_info": {
//       "max_retries": 5,
//       "current_retry": 5
//   },
//   "trigger": {
//       "name": "loginSendEmail"
//   },
//   "table": {
//       "schema": "public",
//       "name": "loginToken"
//   }
// }
export default async function loginSendEmail(req, res) {
  try {
    // hasura event webhook payload
    const {
      event: { op, data },
      table: { name },
    } = req.body;

    const { id, secret, email, approved } = data.new;

    if (!email) {
      throw new Error('email missing');
    }

    // if approved, ignore event
    if (approved) {
      return res
        .status(200)
        .json({ error: false, data: { message: 'approved, ignored event' } });
    }

    // not approved, send email

    const queryParams = [
      ['id', id],
      ['token', secret],
    ]
      .map((qp) => {
        const [key, value] = qp;
        return `${key}=${encodeURIComponent(value)}`;
      })
      .join('&');

    const loginConfirmUrl = `${config.FRONTEND_HOST}/api/auth/confirm?${queryParams}`;
    const phrase = words.getPhraseFromToken(secret);

    const emailHtml = loginConfirmEmail({ email, loginConfirmUrl, phrase });

    const emailResponse = await serverEmail.send(email, {
      subject: 'Login with Magic',
      html: emailHtml,
    });

    return res.status(200).json({ error: false });
  } catch (e) {
    console.error(e);

    return res
      .status(400)
      .json({ error: true, message: e.message, stack: e.stack.split('\n') });
  }
}
