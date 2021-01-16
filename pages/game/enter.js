import * as React from 'react';

import Page from 'src/components/Page';
import Button from 'src/components/Button';

import * as Colyseus from 'colyseus.js';

export default function GameEnter() {
  console.debug({ Colyseus });

  return (
    <Page>
      <div>
        <Button>Game</Button>
      </div>
    </Page>
  );
}
