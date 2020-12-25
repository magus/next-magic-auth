import * as React from 'react';

import styles from 'styles/Button.module.css';

export default function Button({ className, children, ...restProps }) {
  return (
    <button className={styles.button} {...restProps}>
      {children}
    </button>
  );
}
