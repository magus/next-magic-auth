import * as React from 'react';

import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';
import request from 'graphql-request';

export default function LoginConfirm() {
  const pageRef = React.useRef(null);

  React.useEffect(() => {
    if (pageRef.current) {
      // force page height to match window.innerHeight
      document.documentElement.style.height = `${window.innerHeight}px`;

      // walk all parents
      let node = pageRef.current;
      while (node) {
        if (node.offsetHeight) {
          node.style.overflow = 'hidden';

          alert(
            [
              node.tagName,
              node.className,
              node.id,
              'offsetHeight',
              node.offsetHeight,
              'styleHeight',
              node.style.height,
              'END',
            ].join(' '),
          );
        }

        node = node.parentNode;
      }
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
