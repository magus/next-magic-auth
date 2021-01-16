import * as React from 'react';
import dynamic from 'next/dynamic';

import Page from 'src/components/Page';
import Button from 'src/components/Button';

import styles from 'styles/Home.module.css';

GamePage.title = null;

// copy dependencies from game page and include here
// we can dynamically load each one individually so we can track progress
const ModuleLoaders = [
  {
    name: 'Real-time communication utilites',
    load: () => import('colyseus.js'),
  },
];

export default function GamePage(props) {
  const [loadGame, set_loadGame] = React.useState(false);
  const [numberLoaded, set_numberLoaded] = React.useState(0);
  const [messages, set_messages] = React.useState(['Initializing game resources']);

  React.useEffect(() => {
    ModuleLoaders.forEach((moduleLoader) => {
      set_messages((m) => m.concat(`${moduleLoader.name}`));
      moduleLoader.load().then((...args) => {
        set_numberLoaded((n) => n + 1);
      });
    });
  }, []);

  // console.debug('[Game]', {  });

  return (
    <Page className={styles.container}>
      <div className={styles.containerContent}>
        <div>{`${numberLoaded} / ${ModuleLoaders.length}`}</div>

        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}

        {numberLoaded < ModuleLoaders.length ? null : (
          <>
            <Button href="/game/enter">Enter Game</Button>
          </>
        )}
      </div>
    </Page>
  );
}
