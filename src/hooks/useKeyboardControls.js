import * as React from 'react';

const DEFAULT_CAPTURE_RATE = 1000 / 30;
// const DEFAULT_CAPTURE_RATE = 1000;

export default function useKeyboardControls(handleCapture, captureRate = DEFAULT_CAPTURE_RATE) {
  const instance = React.useRef({ lastRun: 0 });
  const keys = React.useRef({});

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
      if (now - instance.current.lastRun < captureRate) {
        return run();
      }

      // Do things here
      // const [time] = now.toTimeString().split(' ');
      // console.debug('[useKeyboardControls]', time, 'checkKeys', keys.current);
      const sanitizedKeys = {};
      Object.keys(keys.current).forEach((key) => {
        if (Keys[key]) {
          sanitizedKeys[key] = true;
        }
      });

      if (Object.keys(sanitizedKeys).length) {
        handleCapture(sanitizedKeys);
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
  });

  // init with a keyboard listeners
  React.useEffect(() => {
    if (!process.browser) return;

    function handleKeyDown() {
      keys.current[event.key] = true;
    }

    function handleKeyUp() {
      delete keys.current[event.key];
    }

    // console.debug('usePageVisibility', 'setup');
    document.addEventListener(Events.keydown, handleKeyDown, false);
    document.addEventListener(Events.keyup, handleKeyUp, false);

    return function cleanup() {
      // console.debug('usePageVisibility', 'cleanup');
      document.removeEventListener(Events.keydown, handleKeyDown, false);
      document.removeEventListener(Events.keyup, handleKeyUp, false);
    };
  }, [captureRate]);
}

const Events = {
  keydown: 'keydown',
  keyup: 'keyup',
};

const Keys = {
  w: 'w',
  a: 'a',
  s: 's',
  d: 'd',
};
