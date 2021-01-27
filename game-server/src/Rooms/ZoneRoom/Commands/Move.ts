import * as THREE from 'three';
import { Command } from '@colyseus/command';

import { State } from '../State';

const VELOCITY_PER_SECOND = 8;
const COMMANDS_PER_SECOND = 30; // user commands captured per second
const VELOCITY_PER_CAPTURE = VELOCITY_PER_SECOND / COMMANDS_PER_SECOND;

export class Move extends Command<State, { sessionId: string; command: any }> {
  validate({ command, sessionId }) {
    const player = this.state.players.get(sessionId);

    // normalize vector (unit vector, max length of 1)
    // then add Math.abs values of x and z components of vector
    // sum of x and y must be less than the hypotenuse of unit vector (Math.sqrt(2) by definition)
    // i.e. sumMagnitude <= Math.sqrt(2) must always be true
    const movementVector = new THREE.Vector3(...command.data);
    const sumMagnitude = Math.abs(movementVector.x) + Math.abs(movementVector.z);
    const isValidVector = sumMagnitude <= Math.sqrt(2);

    return player !== undefined && isValidVector;
  }

  execute({ command, sessionId }) {
    const player = this.state.players.get(sessionId);

    if (!player) return;

    // console.debug('[ZoneRoom]', '(MoveCommand)', { command, sessionId });
    const [x, , z] = command.data;

    this.state.i += 1;
    player.x = round(player.x + VELOCITY_PER_CAPTURE * x);
    player.z = round(player.z + VELOCITY_PER_CAPTURE * z);
  }
}

const round = (value, precision = 2) => +value.toFixed(precision);
