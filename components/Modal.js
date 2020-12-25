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
  const [component, set_component] = React.useState(null);

  function open(ModalContentComponent) {
    set_component(ModalContentComponent);
  }

  function close() {
    set_component(null);
  }

  const value = {
    isOpen: component !== null,
    component,
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
          onClick={modal.close}
        >
          <motion.div
            className={styles.modalContent}
            initial={{ opacity: 0.0, scale: 0.7 }}
            animate={{ opacity: 1.0, scale: 1.0 }}
            exit={{ opacity: 0.0, scale: 0.7 }}
          >
            {modal.component}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
