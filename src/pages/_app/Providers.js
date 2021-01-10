import * as React from 'react';
import { ModalContextProvider } from '@components/Modal';

export default function Providers({ children }) {
  return <ModalContextProvider>{children}</ModalContextProvider>;
}
