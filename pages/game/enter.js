import * as React from 'react';

import * as Colyseus from 'colyseus.js';

import Page from 'src/components/Page';
import Button from 'src/components/Button';

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
