import * as React from 'react';
import Link from 'next/link';

import styles from 'styles/Button.module.css';

export default function Button({ className, children, href, ...restProps }) {
  if (href) {
    return (
      <Link href={href}>
        <a
          className={[className, styles.inlineBlock, styles.button].join(' ')}
          {...restProps}
        >
          {children}
        </a>
      </Link>
    );
  }

  return (
    <button className={[className, styles.button].join(' ')} {...restProps}>
      {children}
    </button>
  );
}
