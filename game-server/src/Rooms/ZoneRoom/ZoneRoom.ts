import { Room, Client, Delayed } from 'colyseus';
import { Dispatcher } from '@colyseus/command';

import * as Physics from '../../../../src/game/Physics';
import * as UserCommands from '../../../../src/game/UserCommands';
import * as Commands from './Commands';

import { State } from './State';

const SIMULATION_INTERVAL = 1000 / 60; // 60 fps

export class ZoneRoom extends Room<State> {
  // maxClients = 100;
  autoDispose = false;
  dispatcher = new Dispatcher(this);

  public _intervalSecond!: Delayed;

  onCreate(options, ...otherArgs) {
    // console.info('[ZoneRoom]', 'onCreate', { options, otherArgs });

    // start the clock ticking
    this.clock.start();

    // Set an interval and store a reference to it
    // so that we may clear it later
    this._intervalSecond = this.clock.setInterval(() => {
      console.info('[ZoneRoom]', '(clock)', this.clock.currentTime);
    }, 1 * 1000);

    this.setState(new State());

    this.onMessage(UserCommands.Move.type, (client, command) => {
      try {
        this.dispatcher.dispatch(new Commands.Move(), {
          sessionId: client.sessionId,
          command,
        });
      } catch (err) {
        console.error('[ZoneRoom]', UserCommands.Move.type, { err });
      }
    });

    this.setSimulationInterval((deltaTime) => {
      try {
        this.update(deltaTime);
      } catch (err) {
        console.error('[ZoneRoom]', 'update', { err });
      }
    }, SIMULATION_INTERVAL);
  }

  update(deltaTime) {
    // console.debug('[ZoneRoom]', 'update', { deltaTime });
    // implement your physics or world updates here!
    // this is a good place to update the room state

    processPlayers(this, deltaTime);
  }

  onAuth(client, options, req, ...otherArgs) {
    // console.info('[ZoneRoom]', 'onAuth', { client, options, req, otherArgs });
    return true;
  }

  onJoin(client: Client, ...otherArgs) {
    console.info('[ZoneRoom]', 'onJoin', client.id);

    this.state.createPlayer(client.sessionId);
    // client.send('sync');
  }

  onLeave(client, ...otherArgs) {
    console.info('[ZoneRoom]', 'onLeave', client.id);
    this.state.removePlayer(client.sessionId);
  }

  onDispose(...otherArgs) {
    // console.info('[ZoneRoom]', 'onDispose', { otherArgs });
    this.dispatcher.stop();
  }
}

function processPlayers(room: ZoneRoom, deltaTime: number) {
  // console.debug('[ZoneRoom]', '(processPlayers)', room.state.players);

  room.state.players.forEach((player, key) => {
    Physics.processGravity(player, deltaTime);
  });
}
