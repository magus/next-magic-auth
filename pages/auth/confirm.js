import * as React from 'react';

import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';

export default function LoginConfirm() {
  const pageRef = React.useRef(null);

  React.useEffect(() => {
    if (pageRef.current) {
      pageRef.current.style.height = `${pageRef.current.offsetHeight}px`;
    }
  }, []);

  return (
    <Page innerRef={pageRef} className={styles.container}>
      <div className={styles.header}>Success!</div>

      <div className={styles.instructions}>
        Go back to the page, you should now be logged in.
      </div>
    </Page>
  );
}
