import * as React from 'react';

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

  if (process.browser && __DEV__) {
    if (!window.__magic) window.__magic = {};
    window.__magic.ModalContext = value;
    // e.g. __magic.ModalContext.open(() => 'Hi')
  }

  return <ModalContext.Provider {...{ value }}>{children}</ModalContext.Provider>;
}
