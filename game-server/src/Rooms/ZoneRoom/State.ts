import { Schema, type, MapSchema } from '@colyseus/schema';

export class Player extends Schema {
  @type('number')
  x = Math.floor(Math.random() * 25);

  @type('number')
  y = 0;

  @type('number')
  z = Math.floor(Math.random() * 25);
}

export class State extends Schema {
  @type('number')
  i = 0;
  @type({ map: Player })
  players = new MapSchema<Player>();

  something = "This attribute won't be sent to the client-side";

  createPlayer(sessionId: string) {
    const player = new Player();
    this.players.set(sessionId, player);
  }

  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }
}
