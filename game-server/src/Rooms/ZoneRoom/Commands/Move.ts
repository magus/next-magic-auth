import * as THREE from 'three';
import { Command } from '@colyseus/command';

import { State } from '../State';

const VELOCITY_PER_SECOND = 8;
const COMMANDS_PER_SECOND = 30; // user commands captured per second
const MOVEMENT_PER_CAPTURE = VELOCITY_PER_SECOND / COMMANDS_PER_SECOND;

export class Move extends Command<State, { sessionId: string; command: any }> {
  validate({ command, sessionId }) {
    const player = this.state.players.get(sessionId);

    let isValid = player !== undefined;

    // normalize vector (unit vector, max length of 1)
    // then add Math.abs values of x and z components of vector
    // sum of x and y must be less than the hypotenuse of unit vector (Math.sqrt(2) by definition)
    // i.e. sumMagnitude <= Math.sqrt(2) must always be true
    if (isValid && command.data.position) {
      const movementVector = new THREE.Vector3(...command.data.position);
      const sumMagnitude = Math.abs(movementVector.x) + Math.abs(movementVector.z);
      const isValidVector = sumMagnitude <= Math.sqrt(2);

      isValid = isValid && isValidVector;
    }

    return isValid;
  }

  execute({ command, sessionId }) {
    const player = this.state.players.get(sessionId);

    if (!player) return;

    // console.debug('[ZoneRoom]', '(MoveCommand)', { command, sessionId });
    if (command.data.jump && Math.abs(player.velocity.y) === 0) {
      // give player a velocity to resolve in the ZomeRoom update
      // console.debug('[ZoneRoom]', '(MoveCommand)', sessionId, 'JUMP');
      player.velocity.y = player.jumpVelocity;
    }

    if (command.data.position) {
      const [x, , z] = command.data.position;

      player.x = round(player.x + MOVEMENT_PER_CAPTURE * x);
      player.z = round(player.z + MOVEMENT_PER_CAPTURE * z);
    }
  }
}

const round = (value, precision = 2) => +value.toFixed(precision);
