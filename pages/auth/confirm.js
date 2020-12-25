import * as React from 'react';

import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';
import request from 'graphql-request';

export default function LoginConfirm() {
  const pageRef = React.useRef(null);

  React.useEffect(() => {
    if (pageRef.current) {
      const cachedContent = pageRef.current.innerHTML;
      pageRef.current.innerHTML = null;
      const frameId = requestAnimationFrame(() => {
        pageRef.current.innerHTML = cachedContent;
      });

      return function cleanup() {
        cancelAnimationFrame(frameId);
      };
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
