import * as React from 'react';

import Page from 'src/components/Page';
import Button from 'src/components/Button';
import { useAuth } from 'src/components/AuthProvider';

import styles from 'styles/Home.module.css';

GamePage.title = null;

const ModuleLoaders = [
  {
    name: 'Real-time communication utilites',
    load: () => import('colyseus.js'),
  },
];

export default function GamePage(props) {
  const auth = useAuth();

  const [numberLoaded, set_numberLoaded] = React.useState(0);
  const [message, set_message] = React.useState('Loading');

  React.useEffect(() => {
    console.debug('[Game]', 'mount');
    ModuleLoaders.forEach((moduleLoader) => {
      set_message(`${moduleLoader.name}`);
      moduleLoader.load().then((...args) => {
        set_numberLoaded((n) => n + 1);
      });
    });
  }, []);

  // console.debug('[Game]', { auth });
  return (
    <Page className={styles.container}>
      <div className={styles.containerContent}>
        <div>{message}</div>
        <div>{`${numberLoaded} / ${ModuleLoaders.length}`}</div>
      </div>
    </Page>
  );
}
