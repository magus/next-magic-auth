import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useAuth } from 'src/components/AuthProvider';
import LoginGateCover from '@components/LoginGate/LoginGateCover';

import styles from 'styles/LoginGate.module.css';

const ANIMATION_TIMEOUT_MS = 3 * 1000;

export default function LoginGateCoverAnimated() {
  const auth = useAuth();
  const [loading, set_loading] = React.useState(!auth.init);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      set_loading(false);
    }, ANIMATION_TIMEOUT_MS);

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, []);

  async function handleAnimationEnd() {
    // console.debug('[LoginGateCoverAnimated]', 'handleAnimationEnd');
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
          <LoginGateCover onAnimationEnd={handleAnimationEnd} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
