import * as React from 'react';

import * as Colyseus from 'colyseus.js';
import * as THREE from 'three';
import { Canvas, extend, useFrame, useThree } from 'react-three-fiber';
import { Stats as DreiStats } from '@react-three/drei';

import Page from 'src/components/Page';
import Button from 'src/components/Button';

const CAMERA_HEIGHT = 100;

export default function GameEnter() {
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

      <Camera position={[1, CAMERA_HEIGHT, 3]} />

      <Player position={[10, 0, 10]} />
      <Player position={[22, 0, 23]} />
      <Player position={[1, 0, 3]} />
      <Player position={[9, 0, 14]} />
      <Player position={[30, 0, 30]} />
    </Canvas>
  );
}

function Player(props) {
  // This reference will give us direct access to the mesh
  const ref = React.useRef();

  return (
    <group ref={ref} {...props}>
      <mesh transparent position={[0, 0.5, 0]} scale={[1, 1, 1]}>
        <boxBufferGeometry args={[1, 1, 1]} attach="geometry" />

        <meshPhysicalMaterial attach="material" color="red" opacity={1.0} />
      </mesh>
    </group>
  );
}

function Camera(props) {
  const ref = React.useRef();
  const { setDefaultCamera } = useThree();

  // Make the camera known to the system
  React.useEffect(() => {
    // window.__game.cameraRef = ref.current;
    void setDefaultCamera(ref.current);
  }, []);

  // Update it every frame
  useFrame(() => ref.current.updateMatrixWorld());

  // by default x is horizontal, z is vertical and y is the 3rd dimension
  // so we rotate the camera about the x axis so that the plane is facing the camera
  // this allows us to use x/z for horizontal/vertical position and y as the third dimension (jump) when needed
  return <perspectiveCamera ref={ref} rotation={[-Math.PI / 2, 0, 0]} {...props} />;
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

  return (
    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} receiveShadow>
      <gridHelper args={[100, 100, 'red', 'white']} position={[0, 0, 0]} rotation={[0, 0, 0]} />
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
