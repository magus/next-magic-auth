import * as React from 'react';
import useWindowHeight from 'src/hooks/useWindowHeight';

import styles from 'styles/Page.module.css';

export default function Page({ children, className, innerRef, forceWindowHeight, ...restProps }) {
  const pageRef = React.useRef();
  // sync pageRef and innerRef
  React.useEffect(() => {
    if (innerRef) {
      innerRef.current = pageRef.current;
    }
  });

  const windowHeight = useWindowHeight();

  const containerStyle = {};
  const containerClassNames = [styles.container];

  if (className) {
    containerClassNames.push(className);
  }

  if (forceWindowHeight) {
    containerClassNames.push(styles.forceWindowHeight);
    containerStyle.height = windowHeight;
  }

  return (
    <div className={containerClassNames.join(' ')} ref={pageRef} {...{ style: containerStyle }} {...restProps}>
      {children}
    </div>
  );
}
