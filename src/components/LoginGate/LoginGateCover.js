import * as React from 'react';
import Image from 'next/image';

import Page from 'src/components/Page';

import styles from 'styles/LoginGate.module.css';

export default function LoginGateCover({ message, onAnimationEnd }) {
  return (
    <div className={styles.loginGateCover}>
      <Page forceWindowHeight>
        <div className={!onAnimationEnd ? undefined : styles.wandAnimation} onAnimationEnd={onAnimationEnd}>
          <Image priority layout="fixed" src="/wand.png" alt="magic wand" width={128} height={128} />
        </div>

        <div className={styles.loginGateCoverMessage}>{message}</div>

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
