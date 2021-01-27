import * as React from 'react';
import * as Colyseus from 'colyseus.js';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { Stats as DreiStats } from '@react-three/drei';

import useKeyboardControls from 'src/hooks/useKeyboardControls';
import * as UserCommands from '@game/UserCommands';

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

  const currentPlayerRef = React.useRef();
  const [movement, set_movement] = React.useState(null);
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
          console.error('[Zone]', 'unexpected onLeave', { code });
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

  useKeyboardControls((keys) => {
    if (!instance.current.room) return;

    const movementUserCommand = new UserCommands.Move(keys);

    // console.debug('[Zone]', { movement, currentPlayerRef });
    // set_movement(movement);

    // optimistically move current player locally immediately
    const [, movementCommand] = movementUserCommand;
    const [x, , z] = movementCommand.data;

    // duplicated in Move.ts
    // TODO refactor into some shared code so we use same logic on server and client for update
    const VELOCITY_PER_SECOND = 2;
    const COMMANDS_PER_SECOND = 30; // user commands captured per second
    const VELOCITY_PER_CAPTURE = VELOCITY_PER_SECOND / COMMANDS_PER_SECOND;
    const round = (value, precision = 2) => +value.toFixed(precision);

    currentPlayerRef.current.translateX(round(VELOCITY_PER_CAPTURE * x));
    currentPlayerRef.current.translateZ(round(VELOCITY_PER_CAPTURE * z));

    // transmit movement to
    instance.current.room.send(...movementUserCommand);
  });

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

function useLerpPosition(props, onPositionUpdate) {
  const FPS = 60;
  const ref = React.useRef({ position: new THREE.Vector3(...props.position) });
  const velocity = props.velocity || 2;
  const maxMovementPerFrame = velocity / FPS;

  const frameDelta = (delta) => {
    const sign = delta < 0 ? -1 : +1;
    // restrict change to at most maxMovementPerFrame
    const frameDelta = Math.min(maxMovementPerFrame, Math.abs(delta));
    // return original sign of delta
    return sign * frameDelta;
  };

  React.useEffect(() => {
    console.info('[useLerpPosition]', 'mount');

    ref.current.position.set(...props.position);
    onPositionUpdate(ref.current.position);
  }, []);

  useFrame(() => {
    const position = ref.current.position;

    const delta = new THREE.Vector3(...props.position).sub(position);

    // for current user only update if absolutely necessary
    // optimistic updates take precedence unless we absolute need correcting
    if (props.isCurrentUser) {
      const needsPositionFix = delta.x > 1 || delta.y > 1 || delta.z > 1;
      if (needsPositionFix) {
        position.set(...props.position);
      }
      return;
    }

    // skip when no delta
    if (!(delta.x === 0 && delta.y === 0 && delta.z === 0)) {
      if (props.immediatePosition) {
        position.set(...props.position);
      } else {
        position.set(
          position.x + frameDelta(delta.x),
          position.y + frameDelta(delta.y),
          position.z + frameDelta(delta.z),
        );
      }

      onPositionUpdate(ref.current.position);
    }
  });

  if (!props.position) throw new Error('useLerpPosition must have a position');
}

const Player = React.forwardRef(function Player(props, outerRef) {
  // This reference will give us direct access to the mesh
  const ref = React.useRef();
  if (outerRef) outerRef.current = ref.current;
  const playerRef = React.useRef();
  const cameraRef = React.useRef();
  const color = props.color || props.isCurrentUser ? 'green' : 'blue';

  useLerpPosition(props, (p) => {
    // console.debug('[Player]', 'useLerpPosition', p);
    // ref.current.position.set(p.x, p.y, p.z);
    const position = ref.current.position;

    ref.current.translateX(p.x - position.x);
    ref.current.translateY(p.y - position.y);
    ref.current.translateZ(p.z - position.z);
  });

  useFrame(() => {
    if (cameraRef.current) {
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

          <meshPhysicalMaterial attach="material" color={color} opacity={1.0} />
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

  // useLerpPosition({ position: lookAt, velocity: 1 }, (p) => {
  //   // console.debug('[Camera]', 'useLerpPosition', p);
  //   lerpPosition.current = p;
  // });

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
