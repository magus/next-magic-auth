import * as React from 'react';

import Button from 'src/components/Button';
import { useAuth } from 'src/components/AuthProvider';
import graphql from 'src/client/graphql/queries';

import styles from 'styles/Login.module.css';

export default function CheckEmailModal({ dismiss, jwtToken, phrase }) {
  const auth = useAuth();
  const approved = graphql.watchLoginRequest(jwtToken);

  React.useEffect(async () => {
    if (approved) {
      await auth.actions.completeLogin();
    }
  }, [approved]);

  React.useEffect(() => {
    if (auth.isLoggedIn) {
      dismiss();
    }
  }, [auth.isLoggedIn]);

  async function handleCancel() {
    await auth.actions.logout();
    dismiss();
  }

  return (
    <div className={styles.checkEmailModal}>
      <div className={styles.checkEmailModalKeepThisTab}>Keep this tab open</div>
      <div>Use your phone to click the magic words in your email</div>
      <Button className={styles.magicWords}>{phrase}</Button>

      <Button simple onClick={handleCancel}>
        Cancel
      </Button>
    </div>
  );
}
