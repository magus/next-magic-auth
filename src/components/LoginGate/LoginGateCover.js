import * as React from 'react';
import Page from 'src/components/Page';

import styles from 'styles/LoginGate.module.css';

export default function LoginGateCover({ message, onAnimationEnd }) {
  function handleAnimationEnd() {
    console.debug('[LoginGateCover]', 'handleAnimationEnd');
    if (typeof onAnimationEnd === 'function') {
      onAnimationEnd();
    }
  }

  return (
    <div className={styles.loginGateCover}>
      <Page forceWindowHeight>
        <div className={styles.animatedWandContainer} onAnimationEnd={handleAnimationEnd}>
          <div className={styles.animationBackground} />
          <div className={styles.animatedWand} />
        </div>

        {/* <div>
        {new Array(500).fill(1).map((_, i) => {
          return (
            <div key={i} style={{ height: 100 }}>
              {i}
            </div>
          );
        })}
      </div> */}
      </Page>
    </div>
  );
}
