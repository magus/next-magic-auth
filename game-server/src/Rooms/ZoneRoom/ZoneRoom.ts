import { Room, Client } from 'colyseus';
import { Dispatcher } from '@colyseus/command';

import * as UserCommands from '../../../../src/game/UserCommands';
import * as Commands from './Commands';

import { State } from './State';

const SIMULATION_INTERVAL = 1000 / 60; // 60 fps

export class ZoneRoom extends Room<State> {
  // maxClients = 100;
  autoDispose = false;
  dispatcher = new Dispatcher(this);

  onCreate(options, ...otherArgs) {
    // console.info('[ZoneRoom]', 'onCreate', { options, otherArgs });

    this.setState(new State());

    this.onMessage(UserCommands.Move.type, (client, command) => {
      this.dispatcher.dispatch(new Commands.Move(), {
        sessionId: client.sessionId,
        command,
      });
    });

    this.setSimulationInterval((deltaTime) => this.update(deltaTime), SIMULATION_INTERVAL);
  }

  update(deltaTime) {
    // console.debug('[ZoneRoom]', 'update', { deltaTime });
    // implement your physics or world updates here!
    // this is a good place to update the room state
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
