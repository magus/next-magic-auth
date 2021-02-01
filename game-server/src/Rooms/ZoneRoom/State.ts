import * as THREE from 'three';
import { Schema, type, MapSchema } from '@colyseus/schema';

export class Vector3 extends Schema {
  @type('number')
  x = 0;

  @type('number')
  y = 0;

  @type('number')
  z = 0;
}
export class Player extends Schema {
  // TODO use position Vector3d  instead of model-level x, y,  z
  @type({ map: Vector3 })
  position = new MapSchema<Vector3>();

  @type('number')
  x = 0;
  @type('number')
  y = 0;
  @type('number')
  z = 0;

  @type('number')
  speed = 8;
  @type('number')
  jumpVelocity = 8;

  // local
  velocity = new THREE.Vector3();
}

export class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  something = "This attribute won't be sent to the client-side";

  createPlayer(sessionId: string) {
    const player = new Player();
    player.x = Math.floor(Math.random() * 25);
    player.z = Math.floor(Math.random() * 25);
    this.players.set(sessionId, player);
  }

  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }
}
