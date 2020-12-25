import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';

export default function LoginConfirm() {
  return (
    <Page className={styles.container}>
      <div className={styles.header}>Success!</div>

      <div className={styles.instructions}>
        Go back to the page, you should now be logged in.
      </div>
    </Page>
  );
}
