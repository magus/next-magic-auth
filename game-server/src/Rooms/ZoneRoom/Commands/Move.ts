import { Command } from '@colyseus/command';

import { State } from '../State';

export class Move extends Command<State, { sessionId: string; command: any }> {
  execute({ command, sessionId }) {
    const player = this.state.players.get(sessionId);

    if (!player) return;

    // console.debug('[ZoneRoom]', '(MoveCommand)', { command, sessionId });

    const movement = { x: 0, y: 0 };
    Object.keys(command.data).forEach((key) => {
      // console.debug('key switch', { key });
      switch (key) {
        case 'w':
          movement.y -= 1;
          break;
        case 's':
          movement.y += 1;
          break;
        case 'a':
          movement.x -= 1;
          break;
        case 'd':
          movement.x += 1;
          break;
      }
    });

    this.state.i += 1;
    player.x += movement.x;
    player.y += movement.y;
  }
}
