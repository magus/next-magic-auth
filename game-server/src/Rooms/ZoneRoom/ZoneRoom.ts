import { Room, Client } from 'colyseus';
import { Dispatcher } from '@colyseus/command';

import * as UserCommands from '../../../../src/game/UserCommands';
import * as Commands from './Commands';

import { State } from './State';

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
