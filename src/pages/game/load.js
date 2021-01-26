import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import PageContainer from 'src/components/Page';
import Button from 'src/components/Button';

import styles from 'styles/GameLoad.module.css';

// copy dependencies from game page and include here
// we can dynamically load each one individually so we can track progress
const ModuleLoaders = [
  {
    key: 'colyseus.js',
    message: 'Real-time communication utilites',
    load: () => import(/* webpackChunkName: "colyseus.js" */ 'colyseus.js'),
  },
  {
    key: 'three',
    message: 'WebGL renderer and utilities',
    load: () => import(/* webpackChunkName: "three" */ 'three'),
  },
  {
    key: 'react-three-fiber',
    message: 'React renderer for WebGL',
    load: () => import(/* webpackChunkName: "react-three-fiber" */ 'react-three-fiber'),
  },
  {
    key: 'orbit-controls',
    message: 'Third person camera controls for WebGL',
    load: () => import(/* webpackChunkName: "orbit-controls" */ 'three/examples/jsm/controls/OrbitControls'),
  },
  {
    key: '@react-three/drei',
    message: 'React renderer for WebGL utilities',
    load: () => import(/* webpackChunkName: "@react-three/drei" */ '@react-three/drei'),
  },
  {
    key: 'game-enter',
    message: 'Game shell',
    load: () => import(/* webpackChunkName: "game-enter" */ '@pages/game/enter'),
  },

  // TODO: build a loader for connecting to game server?
  // async that resolves once a singleton is setup with connections to servers?

  null,
].filter(Boolean);

// // Push a bunch of sleepers to test loading multiple modules
// ModuleLoaders.push(
//   ...new Array(20).fill(0).map((_, i) => {
//     const seconds = +(Math.random() * 4).toFixed(2);

//     return {
//       key: `sleep-${i}`,
//       message: `Sleeping for ${seconds} seconds`,
//       load: () => sleep(seconds),
//     };
//   }),
// );

const MAX_CONCURRENCY = 2;

Page.title = null;

export default function Page(props) {
  const [enterGameDisabled, set_enterGameDisabled] = React.useState(true);
  const [state, set_state] = React.useState([]);

  const numberLoaded = state.filter(({ status }) => status === LoadStatus.success).length;
  const loadProgress = numberLoaded / ModuleLoaders.length;
  const loadingStyle = { width: `${Math.min(1, loadProgress) * 100}%` };

  React.useEffect(() => {
    if (!process.browser) return;

    async function setModuleStatus(i, status) {
      const time = Date.now();
      set_state((state) => {
        const newState = [...state];
        newState[i] = { status, time };

        // update time for unfinished
        newState.forEach((loadState) => {
          if (loadState.status === LoadStatus.pending) {
            loadState.time = time + 1;
          }
        });
        return newState;
      });
    }

    async function loadModule(i) {
      const moduleLoader = ModuleLoaders[i];
      console.debug('[Load]', 'loadModule', moduleLoader.key);
      setModuleStatus(i, LoadStatus.pending);

      const result = await moduleLoader.load();

      console.info(moduleLoader.key, result);
      setModuleStatus(i, LoadStatus.success);
    }

    const active = state.filter(({ status }) => status === LoadStatus.pending).length;
    let openSlots = MAX_CONCURRENCY - active;

    // console.debug("[Load]", { active, openSlots });

    // otherwise, walk modules and load modules
    for (let i = 0; i < ModuleLoaders.length; i++) {
      // no open slots for more downloads, skip with break
      if (openSlots <= 0) break;

      const status = state[i];
      if (!status) {
        openSlots--;
        loadModule(i);
      }
    }
  }, [state]);

  async function handleTransitionEnd() {
    if (numberLoaded >= ModuleLoaders.length) {
      set_enterGameDisabled(false);
    }
  }

  const stateByTime = state.map((_, i) => ({
    ..._,
    moduleLoader: ModuleLoaders[i],
  }));

  stateByTime.sort((a, b) => a.time - b.time);

  // console.debug("[Load]", { state, stateByTime });

  return (
    <PageContainer forceWindowHeight>
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <Button className={styles.button} disabled={enterGameDisabled} prefetch={false} href="/game/enter">
            Enter Game
          </Button>

          <div className={styles.loading}>
            <motion.div className={styles.loaded} animate={loadingStyle} onAnimationComplete={handleTransitionEnd} />
          </div>

          <div className={styles.loadCount}>{`${numberLoaded} / ${ModuleLoaders.length}`}</div>
        </div>

        <div className={styles.bottomContainer}>
          <div className={styles.messages}>
            {stateByTime.map(({ status, moduleLoader }, i) => {
              return (
                <AnimatePresence key={moduleLoader.key}>
                  <motion.div
                    key={moduleLoader.key}
                    className={styles.loadStatus}
                    layout
                    transition={spring}
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: +0 }}
                    exit={{ opacity: 0, y: +25 }}
                  >
                    <div className={styles.status}>［{status === LoadStatus.success ? '✅' : '⏳'}］</div>
                    <div className={styles.message}>{moduleLoader.message}</div>
                  </motion.div>
                </AnimatePresence>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const LoadStatus = {
  none: 'none',
  pending: 'pending',
  success: 'success',
};

const spring = {
  type: 'spring',
  damping: 25,
  stiffness: 120,
};
