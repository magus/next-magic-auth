import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useModal } from '@components/Modal';

import styles from 'styles/modal.module.css';

export default function ModalContainer() {
  const modal = useModal();

  return (
    <AnimatePresence>
      {!modal.isOpen ? null : (
        <motion.div
          className={styles.container}
          initial={{ opacity: 0.0 }}
          animate={{ opacity: 1.0 }}
          exit={{ opacity: 0.0 }}
        >
          <div
            className={styles.modalBackground}
            onClick={modal.config.disableBackgroundDismiss ? undefined : modal.close}
          />

          <motion.div
            className={styles.modalContent}
            initial={{ opacity: 0.0, scale: 0.7 }}
            animate={{ opacity: 1.0, scale: 1.0 }}
            exit={{ opacity: 0.0, scale: 0.7 }}
          >
            {!modal.config.component ? null : <modal.config.component {...modal.config.props} dismiss={modal.close} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
