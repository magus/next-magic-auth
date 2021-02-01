import * as React from 'react';
import { useThree } from 'react-three-fiber';

const DEFAULT_CAPTURES_PER_SECOND = 30;
// const DEFAULT_CAPTURES_PER_SECOND = 1;

export default function useKeyboardControls(handleCapture, capturesPerSecond = DEFAULT_CAPTURES_PER_SECOND) {
  const instance = React.useRef({ lastRun: 0 });
  const keys = React.useRef({});
  const captureRateMs = 1000 / capturesPerSecond;
  const { camera } = useThree();

  // keep camera ref up to date
  instance.current.camera = camera;

  // init raf loop for generating user commands
  React.useEffect(() => {
    if (!process.browser) return;

    let rafId;

    function run() {
      rafId = requestAnimationFrame(checkKeys);
    }

    function checkKeys(event) {
      const now = new Date();

      // skip if not at capture rate
      if (now - instance.current.lastRun < captureRateMs) {
        return run();
      }

      // Do things here
      // const [time] = now.toTimeString().split(' ');
      // console.debug('[useKeyboardControls]', time, 'checkKeys', keys.current);

      const mappedMoves = Object.keys(keys.current).reduce((map, key) => {
        const mappedMove = KeyMap[key];
        if (mappedMove) {
          map[mappedMove] = true;
        }
        return map;
      }, {});

      if (Object.keys(mappedMoves).length) {
        // camera looks down negative z-axis (0, 0, -1)
        const cameraViewVector = new THREE.Vector3(0, 0, -1);

        // get the movement vector which is in direction the camera is currently facing
        // apply the camera rotation to camera viewing vector in order to calculate the vector of movement relative to camera
        const movementVector = cameraViewVector
          .applyQuaternion(instance.current.camera.quaternion)
          .projectOnPlane(new THREE.Vector3(0, 1, 0))
          .normalize();

        const movement = { position: null, jump: false };

        if (mappedMoves[MoveCommand.jump]) {
          movement.jump = true;
        }

        if (mappedMoves[MoveCommand.forward]) {
          movement.position = movementVector.toArray().map((n) => +n.toFixed(2));
        }

        if (movement) {
          handleCapture(movement);
        }
      }

      // continue loop
      instance.current.lastRun = now;
      run();
    }

    // kick off requestAnimationFrame loop
    run();

    return function cleanup() {
      cancelAnimationFrame(rafId);
    };
  }, [captureRateMs]);

  // init with a keyboard listeners
  React.useEffect(() => {
    if (!process.browser) return;

    function handleKeyDown() {
      // console.debug('[useKeyboardControls]', event);
      keys.current[event.code] = true;
    }

    function handleKeyUp() {
      // console.debug('[useKeyboardControls]', event);
      delete keys.current[event.code];
    }

    // console.debug('usePageVisibility', 'setup');
    document.addEventListener(Events.keydown, handleKeyDown, false);
    document.addEventListener(Events.keyup, handleKeyUp, false);

    return function cleanup() {
      // console.debug('usePageVisibility', 'cleanup');
      document.removeEventListener(Events.keydown, handleKeyDown, false);
      document.removeEventListener(Events.keyup, handleKeyUp, false);
    };
  }, []);
}

const Events = {
  keydown: 'keydown',
  keyup: 'keyup',
};

const Keys = {
  w: 'KeyW',
  a: 'KeyA',
  s: 'KeyS',
  d: 'KeyD',
  space: 'Space',
};

const MoveCommand = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
};

// if we ever allow customizing key bindings this map would change
const KeyMap = {
  [Keys.w]: MoveCommand.forward,
  [Keys.s]: MoveCommand.backward,
  [Keys.a]: MoveCommand.left,
  [Keys.d]: MoveCommand.right,
  [Keys.space]: MoveCommand.jump,
};
