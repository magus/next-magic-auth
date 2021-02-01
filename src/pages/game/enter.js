import * as React from 'react';
import * as Colyseus from 'colyseus.js';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { Stats as DreiStats } from '@react-three/drei';

import useKeyboardControls from 'src/hooks/useKeyboardControls';
import * as UserCommands from '@game/UserCommands';
import * as Physics from '@game/Physics';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
extend({ OrbitControls });
const InfiniteGridHelper = require('@three/InfiniteGridHelper').default;
extend({ InfiniteGridHelper });

const CAMERA_HEIGHT = 20;

export default function GameEnter() {
  console.info('[GameEnter]', 'render');

  return (
    <Canvas
      style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,1.0)' }}
      gl={{ antialias: true }}
      invalidateFrameloop={false}
      pixelRatio={window.devicePixelRatio}
      onCreated={({ gl }) => {
        // gl.shadowMap.enabled = true;
        // gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Debug
        // debug settings
        stats={true}
        plane={true}
      />

      <Light />

      <Players />
    </Canvas>
  );
}

function Players() {
  const instance = React.useRef({
    client: null,
    room: null,
    cleanup: false,
  });

  const localPlayer = React.useRef({ velocity: { x: 0, y: 0, z: 0 } });
  const currentPlayerRef = React.useRef();
  const [players, set_players] = React.useState([]);
  const [me, set_me] = React.useState(null);

  React.useEffect(function setupClient() {
    instance.current.cleanup = false;
    let reconnectTimeoutId;
    const DefaultReconnectDelayMs = 2 * 1000;
    let reconnectDelayMs = DefaultReconnectDelayMs;

    async function safeAsyncSetupClient() {
      try {
        await asyncSetupClient();
        // reset reconnect delay
        reconnectDelayMs = DefaultReconnectDelayMs;
      } catch (err) {
        console.info('[Zone]', 'asyncSetupClient', { err });
        // exponential backoff
        reconnectDelayMs *= 2;
        retryReconnect();
      }
    }

    async function retryReconnect() {
      console.info('[Zone]', 'reconnect', { reconnectDelayMs });
      reconnectTimeoutId = setTimeout(safeAsyncSetupClient, reconnectDelayMs);
    }

    async function asyncSetupClient() {
      const client = new Colyseus.Client('ws://localhost:2567');
      instance.current.client = client;
      console.info('[GameEnter]', { client });

      const room = await client.join('zone');
      instance.current.room = room;
      console.info('[Zone]', { room });
      set_me(room.sessionId);

      room.onStateChange((state) => {
        // console.info('[Zone]', { state });

        const players = [];

        state.players.forEach((value, key) => {
          const position = [value.x, value.y, value.z];
          players.push({ key, position });
        });

        set_players(players);
      });

      room.onLeave((code) => {
        console.info('[Zone]', 'onLeave', { code });
        // attempt to reconnect if this was not a teardown
        if (!instance.current.cleanup) {
          console.error('[Zone]', 'UNEXPECTED_ONLEAVE', { code });
          retryReconnect();
        }
      });

      room.onMessage('sync', (message) => {
        console.info('[Zone]', 'sync', message);
      });
    }

    safeAsyncSetupClient();

    return function cleanup() {
      instance.current.cleanup = true;
      if (instance.current.room) {
        instance.current.room.removeAllListeners();
        instance.current.room.leave();
      }
    };
  }, []);

  useKeyboardControls((movement) => {
    if (!instance.current.room) return;

    const movementUserCommand = new UserCommands.Move(movement);
    // transmit movement to room
    instance.current.room.send(...movementUserCommand);

    // optimistically update client player object

    // const player = localPlayer.current;

    // if (movement.jump && Math.abs(player.velocity.y) === 0) {
    //   player.velocity.y = 8;
    // }

    // if (movement.position) {
    //   const [x, , z] = movement.position;

    //   // duplicated in Move.ts
    //   // TODO refactor into some shared code so we use same logic on server and client for update
    //   const VELOCITY_PER_SECOND = 8;
    //   const COMMANDS_PER_SECOND = 30; // user commands captured per second
    //   const MOVEMENT_PER_CAPTURE = VELOCITY_PER_SECOND / COMMANDS_PER_SECOND;
    //   const round = (value, precision = 2) => +value.toFixed(precision);

    //   currentPlayerRef.current.translateX(round(MOVEMENT_PER_CAPTURE * x));
    //   currentPlayerRef.current.translateZ(round(MOVEMENT_PER_CAPTURE * z));
    // }
  }, 30);

  useFrame((webglState, deltaTime) => {
    if (currentPlayerRef.current) {
      if (deltaTime > 0) {
        // keep localPlayer and position in sync
        const player = localPlayer.current;
        player.x = currentPlayerRef.current.position.x;
        player.y = currentPlayerRef.current.position.y;
        player.z = currentPlayerRef.current.position.z;
        Physics.processGravity(player, deltaTime * 1000);
        // sync back processing on localPlayer to player webgl object
        currentPlayerRef.current.position.y = player.y;
      }
    }
  });

  useKeyboardControls((movement) => {
    if (!instance.current.room) return;

    // optimistically move current player locally immediately

    const player = localPlayer.current;

    if (movement.jump && Math.abs(player.velocity.y) === 0) {
      player.velocity.y = 8;
    }

    if (movement.position) {
      const [x, , z] = movement.position;

      // duplicated in Move.ts
      // TODO refactor into some shared code so we use same logic on server and client for update
      const VELOCITY_PER_SECOND = 8;
      const COMMANDS_PER_SECOND = 60; // user commands captured per second
      const MOVEMENT_PER_CAPTURE = VELOCITY_PER_SECOND / COMMANDS_PER_SECOND;
      const round = (value, precision = 2) => +value.toFixed(precision);

      currentPlayerRef.current.translateX(round(MOVEMENT_PER_CAPTURE * x));
      currentPlayerRef.current.translateZ(round(MOVEMENT_PER_CAPTURE * z));
    }
  }, 60);

  // console.info('[Players]', { players, me, movement });

  return (
    <>
      {/* <Player position={[20, 0, 10]} /> */}
      {/* <Player position={[10, 0, 10]} /> */}
      {/* <Player position={[22, 0, 23]} /> */}
      {/* <Player position={[1, 0, 3]} /> */}
      {/* <Player position={[9, 0, 14]} /> */}
      {/* <Player position={[30, 0, 30]} /> */}

      {players.map((player) => {
        const isCurrentUser = player.key === me;
        if (isCurrentUser) {
          return <Player {...player} ref={currentPlayerRef} isCurrentUser />;
        }

        return <Player {...player} />;
      })}
    </>
  );
}

const Player = React.forwardRef(function Player(props, outerRef) {
  // This reference will give us direct access to the mesh
  const ref = React.useRef();
  if (outerRef) outerRef.current = ref.current;
  const instance = React.useRef();
  const playerRef = React.useRef();
  const cameraRef = React.useRef();
  const color = props.color || props.isCurrentUser ? 'green' : 'blue';

  React.useEffect(() => {
    // set position immediately on mount only
    ref.current.position.set(...props.position);
  }, []);

  const FPS = 60;
  const DefaultLerpAlpha = 0.2;
  const VELOCITY_PER_SECOND = 8;
  const velocity = props.velocity || VELOCITY_PER_SECOND;
  const maxMovementPerFrame = velocity / FPS;

  // use latency to estimate the error tolerance, we expect some level of error
  // client side player moves and server only responds after latency
  // TODO find a way to estimate rolling average latency and use here
  const latencyMs = 200;
  const framesPerMs = FPS / 1000;
  const latencyFrames = latencyMs * framesPerMs;
  const errorTolerance = 1.0 * latencyFrames * maxMovementPerFrame;

  const correctionSeconds = latencyMs / 1000;
  const correctionFrames = correctionSeconds * FPS;
  const lerpAlphaSeconds = 1 / correctionFrames;

  useFrame(() => {
    if (ref.current) {
      const delta = new THREE.Vector3(...props.position).sub(ref.current.position);
      const goalPosition = new THREE.Vector3(...props.position);

      if (props.isCurrentUser) {
        // fix y for current player because we simulate physics client side
        // TODO if these values are far out of sync we may need to update
        goalPosition.y = ref.current.position.y;
      }

      // // all server-side movement, no client-side
      // ref.current.position.lerp(goalPosition, lerpPercent);
      // ref.current.position.lerp(goalPosition, 0.01);

      // client side update non current player
      if (!props.isCurrentUser) {
        // move based on speed of player
        const delta = new THREE.Vector3(...props.position).sub(ref.current.position);
        const maxMovement = Math.max(...[delta.x, delta.z].map(Math.abs));
        const frames = maxMovement / maxMovementPerFrame;
        // 1/frames gives us percent change per frame, which is what lerp alpha is
        const lerpAlpha = 1 / frames;
        const safeLerpAlpha = Math.min(DefaultLerpAlpha, lerpAlpha);
        ref.current.position.lerp(goalPosition, safeLerpAlpha);
      } else {
        // // test the lerp based on timing
        // ref.current.position.lerp(goalPosition, lerpAlphaSeconds);

        const maxMovement = Math.max(...[delta.x, delta.z].map(Math.abs));
        if (maxMovement > errorTolerance) {
          // this may fire alot, that's okay? the corrections should be small (imperceptible)
          console.error('[Player]', 'OUT_OF_SYNC', { errorTolerance });
          ref.current.position.lerp(goalPosition, lerpAlphaSeconds);
        }

        // else if (maxMovement > 0) {
        //   const frames = maxMovement / maxMovementPerFrame;
        //   // 1/frames gives us percent change per frame, which is what lerp alpha is
        //   const lerpAlpha = 1 / frames;
        //   // console.debug('currentPlayer', { lerpAlpha });
        //   ref.current.position.lerp(goalPosition, lerpAlpha);
        // }
      }
    }

    if (cameraRef.current && ref.current) {
      // attempt to keep player rotation in sync with camera
      // playerRef.current.rotation.y = cameraRef.current.rotation.z;
      cameraRef.current.lookAt(ref.current.position);
    }
  });

  if (!props.position) throw new Error('Player must have a position');

  const { position, ...propsWithoutPosition } = props;

  return (
    <>
      <group ref={ref} {...propsWithoutPosition}>
        <mesh ref={playerRef} transparent position={[0, 0.5, 0]} scale={[1, 1, 1]}>
          <boxBufferGeometry args={[1, 1, 1]} attach="geometry" />

          {props.isCurrentUser ? (
            <meshNormalMaterial attach="material" opacity={1.0} />
          ) : (
            <meshPhysicalMaterial attach="material" color={color} opacity={1.0} />
          )}
        </mesh>

        {!props.isCurrentUser ? null : <Camera position={[0, CAMERA_HEIGHT, CAMERA_HEIGHT * 1.5]} ref={cameraRef} />}
      </group>
    </>
  );
});

const Camera = React.forwardRef(function Camera(props, outerRef) {
  const ref = React.useRef();
  if (outerRef) outerRef.current = ref.current;

  // const lerpPosition = React.useRef();
  const { camera, setDefaultCamera } = useThree();

  const { lookAt, position, ...restProps } = props;

  // Make the camera known to the system
  React.useEffect(() => {
    if (window.__game) window.__game.cameraRef = ref.current;

    void setDefaultCamera(ref.current);

    // initialize with position
    ref.current.position.set(...position);
  }, []);

  // Update it every frame
  useFrame(() => {
    // ref.current.lookAt(0, 0, 0);

    // ref.current.lookAt(...lookAt);

    // const p = lerpPosition.current;
    // ref.current.lookAt(p.x, p.y, p.z);
    if (ref.current) {
      ref.current.updateMatrixWorld();
    }
  });

  // by default x is horizontal, z is vertical and y is the 3rd dimension
  // so we rotate the camera about the x axis so that the plane is facing the camera
  // this allows us to use x/z for horizontal/vertical position and y as the third dimension (jump) when needed
  return (
    <>
      <perspectiveCamera
        ref={ref}
        // {...props}
        {...restProps}
        // rotation={[0, 0, 0]}
        // rotation={[-Math.PI / 2, 0, 0]}
        // rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      />
      <OrbitControlsCamera />
    </>
  );
});

function Debug(props) {
  React.useEffect(() => {
    window.THREE = THREE;
    window.__game = {};
  }, []);

  return (
    <>
      {!props.plane ? null : <Plane />}
      {!props.stats ? null : <Stats />}
      <axesHelper args={[1000]} />
    </>
  );
}

function Light() {
  return (
    <React.Fragment>
      <ambientLight intensity={0.5} penumbra={1} />
      {/* <spotLight intensity={0.1} position={[0, 10, 0]} penumbra={1} castShadow /> */}
    </React.Fragment>
  );
}

function Plane() {
  const defaultAxisColor = 'white';
  const zeroAxisColor = defaultAxisColor;

  return (
    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} receiveShadow>
      <gridHelper args={[100, 100, zeroAxisColor, defaultAxisColor]} position={[0, 0, 0]} rotation={[0, 0, 0]} />
      {/* <infiniteGridHelper args={[1, 1]} /> */}

      {/* <planeBufferGeometry args={[1000, 1000]} attach="geometry" /> */}
      {/* <meshPhysicalMaterial attach="material" color={'rgba(0,0,0,1.0)'} /> */}
    </mesh>
  );
}

function Stats(props) {
  return (
    <DreiStats
      showPanel={0} // Start-up panel (default=0)
      className="stats" // Optional className to add to the stats container dom element
      {...props} // All stats.js props are valid
    />
  );
}

function OrbitControlsCamera(props) {
  const ref = React.useRef();
  const { camera, gl, invalidate } = useThree();

  useFrame(() => {
    if (ref.current) {
      ref.current.update();
    }
  });

  return (
    <orbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      // autoRotate
      enableDamping
      enablePan={false}
      // minPolarAngle={Math.PI / 3}
      // maxPolarAngle={Math.PI / 2}
      {...props}
    />
  );
}
