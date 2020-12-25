import * as React from 'react';
import { useRouter } from 'next/router';

import Button from 'components/Button';

import styles from 'styles/email.module.css';

export default function Email() {
  const router = useRouter();
  const {
    email = 'test@test.com',
    loginConfirmUrl = 'https://domain.com/api/blah/blah',
    phrase = 'Testy Tester',
  } = router.query;

  return (
    <table
      className={styles.container}
      cellPadding="0"
      cellSpacing="0"
      border="0"
    >
      <tbody>
        <tr>
          <td>
            <span className={styles.paragraph}>
              Click the magic words below to login as{' '}
              <b className={styles.email}>{email}</b>.
              <br />
              The magic words will only work for the next 2 hours.
            </span>
          </td>
        </tr>

        <tr>
          <td>
            <a href={loginConfirmUrl}>
              <Button>{phrase}</Button>
            </a>
          </td>
        </tr>

        <tr>
          <td>
            <span className={styles.paragraph}>
              Ensure the magic words match what you saw on the login page.
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
