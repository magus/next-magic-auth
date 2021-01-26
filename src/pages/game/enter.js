import * as React from 'react';

import * as Colyseus from 'colyseus.js';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { Stats as DreiStats } from '@react-three/drei';

import Page from 'src/components/Page';
import Button from 'src/components/Button';
import useKeyboardControls from 'src/hooks/useKeyboardControls';
import * as UserCommands from '@game/UserCommands';

const CAMERA_HEIGHT = 100;

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
      <Debug stats={true} plane={true} orbitControls={false} />

      <Light />

      <Camera position={[0, CAMERA_HEIGHT, 0]} />

      <Players />
    </Canvas>
  );
}

function Players() {
  const instance = React.useRef({
    client: null,
    room: null,
  });

  const [players, set_players] = React.useState([]);
  const [me, set_me] = React.useState(null);

  React.useEffect(function setupClient() {
    let cleanup = false;
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
          const position = [value.x, 0, value.y];
          players.push({ key, position });
        });
        set_players(players);
      });

      room.onLeave((code) => {
        console.info('[Zone]', 'onLeave', { code });
        // attempt to reconnect if this was not a teardown
        if (!cleanup) {
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
      cleanup = true;
      if (instance.current.room) {
        instance.current.room.removeAllListeners();
        instance.current.room.leave();
      }
    };
  }, []);

  useKeyboardControls((keys) => {
    if (!instance.current.room) return;
    instance.current.room.send(...new UserCommands.Move(keys));
  });

  // console.info('[Players]', { players, me });

  return (
    <>
      <Player position={[20, 0, 10]} />
      {/* <Player position={[10, 0, 10]} /> */}
      {/* <Player position={[22, 0, 23]} /> */}
      {/* <Player position={[1, 0, 3]} /> */}
      {/* <Player position={[9, 0, 14]} /> */}
      {/* <Player position={[30, 0, 30]} /> */}

      {players.map((player) => {
        const color = player.key === me ? 'green' : 'blue';
        return <Player {...player} {...{ color }} />;
      })}
    </>
  );
}

function Player(props) {
  const FPS = 60;
  // This reference will give us direct access to the mesh
  const ref = React.useRef();
  const color = props.color || 'red';
  const velocity = props.velocity || 8;
  const maxMovementPerFrame = velocity / FPS;

  const frameDelta = (delta) => {
    const sign = delta < 0 ? -1 : +1;
    // restrict change to at most maxMovementPerFrame
    const frameDelta = Math.min(maxMovementPerFrame, Math.abs(delta));
    // return original sign of delta
    return sign * frameDelta;
  };

  React.useEffect(() => {
    console.info('[Player]', 'mount');
    ref.current.position.set(...props.position);
  }, []);

  useFrame(() => {
    const position = ref.current.position;
    const delta = new THREE.Vector3(...props.position).sub(position);

    if (!(delta.x === 0 && delta.y === 0 && delta.z === 0)) {
      position.set(
        position.x + frameDelta(delta.x),
        position.y + frameDelta(delta.y),
        position.z + frameDelta(delta.z),
      );
    }
  });

  if (!props.position) throw new Error('Player must have a position');

  const { position, ...propsWithoutPosition } = props;

  return (
    <group ref={ref} {...propsWithoutPosition}>
      <mesh transparent position={[0, 0.5, 0]} scale={[1, 1, 1]}>
        <boxBufferGeometry args={[1, 1, 1]} attach="geometry" />

        <meshPhysicalMaterial attach="material" color={color} opacity={1.0} />
      </mesh>
    </group>
  );
}

function Camera(props) {
  const ref = React.useRef();
  const { setDefaultCamera } = useThree();

  // Make the camera known to the system
  React.useEffect(() => {
    if (window.__game) window.__game.cameraRef = ref.current;
    void setDefaultCamera(ref.current);
  }, []);

  // Update it every frame
  useFrame(() => ref.current.updateMatrixWorld());

  // by default x is horizontal, z is vertical and y is the 3rd dimension
  // so we rotate the camera about the x axis so that the plane is facing the camera
  // this allows us to use x/z for horizontal/vertical position and y as the third dimension (jump) when needed
  return (
    <perspectiveCamera
      ref={ref}
      {...props}
      // rotation={[0, 0, 0]}
      // rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

function Debug(props) {
  React.useEffect(() => {
    window.THREE = THREE;
    window.__game = {};
  }, []);

  return (
    <>
      {!props.plane ? null : <Plane />}
      {!props.stats ? null : <Stats />}
      {!props.orbitControls ? null : <OrbitControls />}
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
  const InfiniteGridHelper = require('@three/InfiniteGridHelper').default;

  extend({ InfiniteGridHelper });

  const defaultAxisColor = 'white';
  const zeroAxisColor = defaultAxisColor;

  return (
    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} receiveShadow>
      <gridHelper args={[100, 100, zeroAxisColor, defaultAxisColor]} position={[0, 0, 0]} rotation={[0, 0, 0]} />
      <infiniteGridHelper args={[1, 1]} />

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

function OrbitControls() {
  const { OrbitControls } = require('three/examples/jsm/controls/OrbitControls');

  extend({ OrbitControls });

  const ref = React.useRef();
  const { camera, gl, invalidate } = useThree();

  useFrame(() => ref.current.update());

  return (
    <orbitControls
      ref={ref}
      args={[camera, gl.domElement]}
      // autoRotate
      enableDamping
      // minPolarAngle={Math.PI / 3}
      // maxPolarAngle={Math.PI / 2}
    />
  );
}
