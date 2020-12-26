import * as React from 'react';
import { useRouter } from 'next/router';

import Button from 'src/components/Button';

import styles from 'styles/email.module.css';

export default function Email() {
  const router = useRouter();
  const {
    email = 'test@test.com',
    loginConfirmUrl = 'https://domain.com/api/blah/blah',
    phrase = 'testy tester',
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
              <strong className={styles.email}>{email}</strong>.
              <br />
              The magic words will only work for the next 2 hours.
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
            <span className={styles.paragraph}>
              Ensure the magic words match what you saw on the login page.
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
