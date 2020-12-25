import * as React from 'react';

import styles from 'styles/Button.module.css';

export default function Button({ className, children, href, ...restProps }) {
  if (href) {
    return (
      <a
        href={href}
        className={[className, styles.button].join(' ')}
        {...restProps}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={[className, styles.button].join(' ')} {...restProps}>
      {children}
    </button>
  );
}
