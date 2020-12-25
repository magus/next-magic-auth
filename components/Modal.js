import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import styles from 'styles/modal.module.css';

const DefaultModalContext = null;
const ModalContext = React.createContext(DefaultModalContext);

export function useModal() {
  const modal = React.useContext(ModalContext);

  if (modal === DefaultModalContext) {
    throw new Error('ModalContextProvider must be setup in React tree');
  }

  return modal;
}

export function ModalContextProvider({ children }) {
  const [config, set_config] = React.useState({ component: null });

  function open(component, config) {
    set_config({ component, ...config });
  }

  function close() {
    set_config({ component: null });
  }

  const value = {
    isOpen: config.component !== null,
    config,
    open,
    close,
  };

  return (
    <ModalContext.Provider {...{ value }}>{children}</ModalContext.Provider>
  );
}

export function ModalContainer() {
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
            onClick={
              modal.config.disableBackgroundDismiss ? undefined : modal.close
            }
          />

          <motion.div
            className={styles.modalContent}
            initial={{ opacity: 0.0, scale: 0.7 }}
            animate={{ opacity: 1.0, scale: 1.0 }}
            exit={{ opacity: 0.0, scale: 0.7 }}
          >
            {!modal.config.component ? null : (
              <modal.config.component
                {...modal.config.props}
                dismiss={modal.close}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
