import * as React from 'react';

import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';
import request from 'graphql-request';

export default function LoginConfirm() {
  React.useEffect(() => {
    // force page height to match window.innerHeight
    document.documentElement.style.height = `${window.innerHeight}px`;
  }, []);

  return (
    <Page className={styles.container}>
      <div className={styles.header}>Success!</div>

      <div className={styles.instructions}>
        Go back to the page, you should now be logged in.
      </div>
    </Page>
  );
}
