import * as React from 'react';
import { ModalContainer, ModalContextProvider } from 'components/Modal';

export default function Page({ children, ...restProps }) {
  return (
    <div {...restProps}>
      {children}
      <ModalContainer />
    </div>
  );
}
