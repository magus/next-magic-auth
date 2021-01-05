import * as React from 'react';
import Image from 'next/image';

import { useAuth } from 'src/components/AuthProvider';
import Page from 'src/components/Page';
import LoginPage from 'pages/auth/login';

import styles from 'styles/LoginGate.module.css';

export default function LoginGate({ children }) {
  const auth = useAuth();
  const [loading, set_loading] = React.useState(!auth.init);

  const overrideProps = {};

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      set_loading(false);
    }, 3 * 1000);

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, []);

  async function handleAnimationEnd() {
    set_loading(false);
  }

  if (loading) {
    return (
      <Page forceWindowHeight>
        <div
          className={styles.wandAnimation}
          onAnimationEnd={handleAnimationEnd}
        >
          <Image
            priority
            layout="fixed"
            src="/wand.png"
            alt="magic wand"
            width={128}
            height={128}
          />
        </div>

        {/* {new Array(500).fill(1).map((_, i) => {
          return <div style={{ height: 100 }}>Content</div>;
        })} */}
      </Page>
    );
  }

  if (!auth.isLoggedIn) {
    return <LoginPage />;
  }

  return children;
}
