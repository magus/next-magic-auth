import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useAuth } from 'src/components/AuthProvider';
import Page from 'src/components/Page';
import LoginPage from 'pages/auth/login';

import styles from 'styles/LoginGate.module.css';

export default function LoginGate(props) {
  return (
    <React.Fragment>
      <LoginGateContent {...props} />
      <LoginGateCover />
    </React.Fragment>
  );
}

function LoginGateCover() {
  const auth = useAuth();
  const [loading, set_loading] = React.useState(!auth.init);

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

  const hideLoginGate = !loading && auth.init;

  return (
    <AnimatePresence>
      {hideLoginGate ? null : (
        <motion.div
          className={styles.loginGateCover}
          initial={false}
          animate={{ opacity: 1.0 }}
          exit={{ opacity: 0.0 }}
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoginGateContent({ children }) {
  const auth = useAuth();

  if (!auth.isLoggedIn) {
    return <LoginPage />;
  }

  return children;
}
