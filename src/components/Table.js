import * as React from 'react';

import styles from 'styles/Table.module.css';

export default function Table({ header, children }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>{header}</div>
      <div className={styles.table}>{children}</div>
    </div>
  );
}
