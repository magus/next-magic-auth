import * as React from 'react';
import Image from 'next/image';

import { useAuth } from 'src/components/AuthProvider';
import Page from 'src/components/Page';

export default function LoginGate({ children }) {
  const auth = useAuth();
  const [loading, set_loading] = React.useState(!auth.init);

  const overrideProps = {};

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      set_loading(false);
    }, 2 * 1000);

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <Page forceWindowHeight>
        <Image
          priority
          layout="fixed"
          src="/wand.png"
          alt="magic wand"
          width={128}
          height={128}
        />
        {/* {new Array(500).fill(1).map((_, i) => {
          return <div style={{ height: 100 }}>Content</div>;
        })} */}
      </Page>
    );
  }

  return children;
}
