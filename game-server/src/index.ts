import express from 'express';
// import serveIndex from 'serve-index';
// import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import { Server, matchMaker } from 'colyseus';
// import { Server, LobbyRoom, RelayRoom } from 'colyseus';
// import { monitor } from '@colyseus/monitor';

// // Import demo room handlers
// import { ChatRoom } from "./rooms/01-chat-room";
// import { StateHandlerRoom } from "./rooms/02-state-handler";
// import { AuthRoom } from "./rooms/03-auth";
// import { ReconnectionRoom } from './rooms/04-reconnection';
// import { CustomLobbyRoom } from './rooms/07-custom-lobby-room';

import { ZoneRoom } from './Rooms/ZoneRoom/ZoneRoom';

const port = Number(process.env.PORT || 2567) + Number(process.env.NODE_APP_INSTANCE || 0);
const app = express();

app.use(cors());
app.use(express.json());

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 5000,
  pingMaxRetries: 2,
});

// Make sure to never call the `simulateLatency()` method in production.
if (process.env.NODE_ENV !== 'production') {
  // simulate 200ms latency between server and client.
  gameServer.simulateLatency(200);
}

// // Define "lobby" room
// gameServer.define("lobby", LobbyRoom);

// Define "zone" room
gameServer.define('zone', ZoneRoom, /* default options */ { defaultOption: 'defaultOptionValue' });

// class CustomRelayRoom extends RelayRoom {
//   // maxClients = 100;
//   autoDispose = false;

//   onCreate(options) {
//     console.debug('CustomRelayRoom', 'onCreate', { options });
//   }
// }
// // Define "relay" room
// gameServer
//   .define('relay', CustomRelayRoom, /* default options */ { default: 'blah' })
//   .on('create', (room) => console.debug('[relay]', 'room created', room.roomId))
//   .on('dispose', (room) => console.debug('[relay]', 'room disposed', room.roomId))
//   .on('join', (room, client) => console.debug('[relay]', client.id, 'joined', room.roomId))
//   .on('leave', (room, client) => console.debug('[relay]', client.id, 'left', room.roomId));

// // Define "chat" room
// gameServer.define("chat", ChatRoom)
//     .enableRealtimeListing();

// // Register ChatRoom with initial options, as "chat_with_options"
// // onInit(options) will receive client join options + options registered here.
// gameServer.define("chat_with_options", ChatRoom, {
//     custom_options: "you can use me on Room#onCreate"
// });

// // Define "state_handler" room
// gameServer.define("state_handler", StateHandlerRoom)
//     .enableRealtimeListing();

// // Define "auth" room
// gameServer.define("auth", AuthRoom)
//     .enableRealtimeListing();

// // Define "reconnection" room
// gameServer.define("reconnection", ReconnectionRoom)
//     .enableRealtimeListing();

// // Define "custom_lobby" room
// gameServer.define("custom_lobby", CustomLobbyRoom);

// app.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}))
// app.use('/', express.static(path.join(__dirname, "static")));

// // (optional) attach web monitoring panel
// app.use('/colyseus', monitor());

// gameServer.onShutdown(function(){
//   console.log(`game server is going down.`);
// });

// process.on("uncaughtException", (e) => {
//   console.log(e.stack);
//   process.exit(1);
// });

async function setup() {
  const room = await matchMaker.createRoom('zone', /* options */ { matchmakerOption: 'matchmakerOptionValue' });
  console.debug('[setup]', { room });

  gameServer.listen(port);

  console.log(`Listening on http://localhost:${port}`);
}

setup();
