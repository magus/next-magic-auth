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
  null,
].filter((_) => !!_);

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

      moduleLoader.load().then((...args) => {
        console.info(moduleLoader.key, ...args);
        setModuleStatus(i, LoadStatus.success);
      });
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
    <PageContainer className={styles.container}>
      <div className={styles.container}>
        <Button className={styles.button} disabled={enterGameDisabled} prefetch={false} href="/game/enter">
          Enter Game
        </Button>

        <div className={styles.loading}>
          <motion.div className={styles.loaded} animate={loadingStyle} onAnimationComplete={handleTransitionEnd} />
        </div>

        <div className={styles.loadCount}>{`${numberLoaded} / ${ModuleLoaders.length}`}</div>

        <div className={styles.messages}>
          {stateByTime.map(({ status, moduleLoader }, i) => {
            return (
              <AnimatePresence key={moduleLoader.key}>
                <motion.div
                  key={moduleLoader.key}
                  className={styles.loadStatus}
                  layout
                  transition={spring}
                  initial={{ opacity: 0, x: -25, height: 20 }}
                  animate={{ opacity: 1, x: +0, height: 20 }}
                  exit={{ opacity: 0, y: +25, height: 20 }}
                >
                  <div className={styles.status}>{status === LoadStatus.success ? '✅' : '⏳'}</div>
                  <div className={styles.message}>{moduleLoader.message}</div>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}

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
