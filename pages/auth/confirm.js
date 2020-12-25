import * as React from 'react';

import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';
import request from 'graphql-request';

export default function LoginConfirm() {
  const pageRef = React.useRef(null);

  // Chrome iOS cannot vertically center properly
  // The first load has the wrong inner height

  // React.useEffect(() => {
  //   requestAnimationFrame(() => {
  //     requestAnimationFrame(() => {
  //       // force page height to match window.innerHeight
  //       document.documentElement.style.height = `${window.innerHeight}px`;
  //     });
  //   });
  // }, []);

  return (
    <Page innerRef={pageRef} className={styles.container}>
      <div className={styles.header}>Success!</div>

      <div className={styles.instructions}>
        Go back to the page, you should now be logged in.
      </div>
      <div className={styles.instructions}>This window can be closed now.</div>
    </Page>
  );
}
