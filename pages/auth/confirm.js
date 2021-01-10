import * as React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import Page from 'src/components/Page';
import Button from 'src/components/Button';

import styles from 'styles/auth-confirm.module.css';

LoginConfirm.disableAuth = true;
LoginConfirm.title = 'Login confirmed';

export default function LoginConfirm() {
  const pageRef = React.useRef(null);
  const router = useRouter();
  const { email } = router.query;

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
      <div className={styles.header}>You are logged in</div>

      <div className={styles.instructions}>Go back to the original page.</div>
      <div className={styles.instructions}>This window can be closed.</div>

      <Link href={!email ? '/' : `/?email=${email}`}>
        <a className={styles.loginHereToo}>
          Click here to login here too
          {!email ? null : <span className={styles.email}> ({email})</span>}
        </a>
      </Link>
    </Page>
  );
}
