import * as React from 'react';
import { useRouter } from 'next/router';

import { expiresMinutesDuration } from 'src/server/time';

import Button from 'src/components/Button';

import styles from 'styles/email.module.css';

Email.disableAuth = true;

export default function Email() {
  const router = useRouter();
  const {
    email = 'test@test.com',
    loginConfirmUrl = 'https://domain.com/api/blah/blah',
    phrase = 'testy tester',
    // e.g. http://localhost:3000/auth/email?expireMinutes=676
    expireMinutes = 60 * 2,
  } = router.query;

  const expiresIn = expiresMinutesDuration(expireMinutes);

  return (
    <table className={styles.container} cellPadding="0" cellSpacing="0" border="0">
      <tbody>
        <tr>
          <td>
            <span className={styles.paragraph}>
              Click the magic words below to login as <strong className={styles.email}>{email}</strong>.
              <br />
              The magic words will only work for the next {expiresIn}.
            </span>
          </td>
        </tr>

        <tr>
          <td>
            <Button href={loginConfirmUrl}>{phrase}</Button>
          </td>
        </tr>

        <tr>
          <td>
            <span className={styles.paragraph}>Ensure the magic words match what you saw on the login page.</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
