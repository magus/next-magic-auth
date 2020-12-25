import * as React from 'react';

import Page from 'components/Page';

import styles from 'styles/auth-confirm.module.css';
import request from 'graphql-request';

export default function LoginConfirm() {
  const pageRef = React.useRef(null);

  React.useEffect(() => {
    let frameId;

    if (pageRef.current) {
      alert(`window.innerHeight: ${window.innerHeight}`);
      alert(`window.outerHeight: ${window.outerHeight}`);

      // walk all parents
      let node = pageRef.current;
      while (node) {
        if (node.offsetHeight) {
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

      // frameId = requestAnimationFrame(() => {
      //   pageRef.current.display = '';
      // });
    }

    return function cleanup() {
      cancelAnimationFrame(frameId);
    };
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
