import * as React from 'react';

import { useModal } from 'src/components/Modal';
import usePageVisibility from 'src/hooks/usePageVisibility';
import CheckEmailModal from 'src/components/CheckEmailModal';

const DefaultAuthContext = null;
const AuthContext = React.createContext(DefaultAuthContext);

export function useAuth() {
  const auth = React.useContext(AuthContext);

  if (auth === DefaultAuthContext) {
    throw new Error('AuthProvider must be setup in React tree');
  }

  return auth;
}

const LoggedOutState = {
  jwt: null,
  user: null,
};

const ExpireTimerFrequencyMs = 5 * 1000;
const ExpireDurationThreshold = 0.25;

export function AuthProvider({ children }) {
  const instance = React.useRef({
    pendingRefresh: null,
    timerFrequencyMs: ExpireTimerFrequencyMs,
  });

  const modal = useModal();
  const [state, set_state] = React.useState(LoggedOutState);
  const [init, set_init] = React.useState(false);

  // console.debug('[AuthProvider]', { init, state });

  // init with a refresh
  React.useEffect(async () => {
    const success = await refreshTokens();
    set_init(true);
  }, []);

  // init with a page visiblity listener
  usePageVisibility(async (isVisible) => {
    if (isVisible) {
      const timeUntilThreshold = timeUntilExpireThresholdMs();
      // console.debug('[AuthProvider]', 'usePageVisibility', {
      //   timeUntilThreshold,
      // });
      if (typeof timeUntilThreshold === 'number' && timeUntilThreshold <= 0) {
        // refresh needed
        await refreshTokens();
      }
    }
  });

  function timeUntilExpireThresholdMs() {
    if (state.expires instanceof Date) {
      const timeLeftMs = state.expires.getTime() - Date.now();
      // calculate time in ms until threshold
      const timeUntilThreshold = timeLeftMs - state.expireThreshold;
      return timeUntilThreshold;
    }

    return null;
  }

  // track expires time to refresh jwt as needed
  React.useEffect(() => {
    // do nothing if expires is not a date
    if (!(state.expires instanceof Date)) {
      // console.debug('[AuthProvider]', 'checkExpires', 'skip');
      return;
    }

    let timeoutId;

    async function checkExpires() {
      // calculate time in ms until threshold
      const timeUntilThreshold = timeUntilExpireThresholdMs();

      // refresh token if within expireThreshold
      if (timeUntilThreshold <= 0) {
        await refreshTokens();
      }
      // wait until threshold or ping at default frequency
      const nextTimeoutMs = timeUntilThreshold > 0 ? timeUntilThreshold : instance.current.timerFrequencyMs;

      console.debug('[AuthProvider]', 'checkExpires', {
        timeUntilThreshold,
        nextTimeoutMs,
      });

      // call again near expire threshold
      timeoutId = setTimeout(checkExpires, nextTimeoutMs);
    }

    // start checking expires
    timeoutId = setTimeout(checkExpires, instance.current.timerFrequencyMs);

    return function cleanup() {
      // console.debug('checkExpires', 'cleanup');
      clearTimeout(timeoutId);
    };
  }, [state.expires]);

  async function setAuthentication(json) {
    const { jwtToken, loginRequestId, user } = json;
    const jwt = jwtToken.encoded;
    const expires = new Date(jwtToken.expires);
    const expireThreshold = ExpireDurationThreshold * (expires - Date.now());

    set_state({
      ...state,
      loginRequestId,
      user,
      jwt,
      expires,
      expireThreshold,
    });
    return jwt;
  }

  async function logout() {
    set_state(LoggedOutState);
    await fetch('/api/auth/logout', { method: 'POST' });
    // window.location = '/';
  }

  async function login(email) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.status === 200) {
      const json = await response.json();
      if (json) {
        modal.open(CheckEmailModal, {
          props: json,
          disableBackgroundDismiss: true,
        });
      }
    }
  }

  async function completeLogin() {
    const response = await fetch('/api/auth/complete', {
      method: 'POST',
    });
    if (response.status === 200) {
      const json = await response.json();
      if (json.jwtToken) {
        await setAuthentication(json);
      }
    }
  }

  async function refreshTokens() {
    // skip on server
    if (!process.browser) return;

    if (instance.current.pendingRefresh) {
      const capturedPendingRefresh = instance.current.pendingRefresh;
      return await capturedPendingRefresh;
    }

    async function handleRefreshTokens() {
      try {
        const response = await fetch('/api/auth/refresh', { method: 'POST' });

        const json = await response.json();

        if (json.error) {
          await logout();
          return true;
        } else if (json.loginRequestApproved) {
          await completeLogin();
          return true;
        } else if (json.loginRequest) {
          modal.open(CheckEmailModal, {
            props: json.loginRequest,
            disableBackgroundDismiss: true,
          });
          return true;
        } else if (json.jwtToken) {
          await setAuthentication(json);
          return true;
        } else if (response.status === 200) {
          // no-op, no cookie no refresh
          return true;
        }

        console.error('[AuthProvider]', 'handleRefreshTokens', { response, json });
      } catch (error) {
        console.error('[AuthProvider]', 'handleRefreshTokens', { error });
      }

      return false;
    }

    // set shared pendingRefresh
    instance.current.pendingRefresh = handleRefreshTokens();

    // wait shared pending refresh
    const result = await instance.current.pendingRefresh;

    // handle backoff for retrying
    if (!result) {
      // unable to handle response, increase latency for next request
      console.debug('[AuthProvider]', 'exponential backoff timerFrequencyMs');
      instance.current.timerFrequencyMs *= 2;
    } else {
      // reset timer frequency
      console.debug('[AuthProvider]', 'restoring timerFrequencyMs');
      instance.current.timerFrequencyMs = ExpireTimerFrequencyMs;
    }

    // reset pendingRefresh back to null
    instance.current.pendingRefresh = null;

    return result;
  }

  const isLoggedIn = !!state.jwt;

  const value = {
    ...state,
    init: init || !!state.jwt,
    isLoggedIn,
    actions: {
      logout,
      login,
      completeLogin,
      refreshTokens,
    },
  };

  return <AuthContext.Provider {...{ value }}>{children}</AuthContext.Provider>;
}

// usage (in a pages component)
//   export const getServerSideProps = requirePageAuth;
// should return an object with props et al.
// see https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering
export function requirePageAuth(handleAuth) {
  return async (context) => {
    let session;

    // use context.req to setup auth session
    // const session = await getSession(context.req);
    // console.debug('requirePageAuth', context.req);

    if (!session) {
      return {
        props: {},
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    if (typeof handleAuth === 'function') {
      return handleAuth(context, session);
    }

    return {
      props: { session },
    };
  };
}
