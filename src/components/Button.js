import * as React from 'react';
import Link from 'next/link';

import styles from 'styles/Button.module.css';

export default function Button({ className, children, href, simple, ...restProps }) {
  if (simple) {
    return (
      <button className={[styles.simple, className].join(' ')} {...restProps}>
        {children}
      </button>
    );
  } else if (href) {
    return (
      <Link href={href} {...restProps} {...restProps}>
        <a className={[className, styles.inlineBlock, styles.button].join(' ')} disabled={restProps.disabled}>
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
