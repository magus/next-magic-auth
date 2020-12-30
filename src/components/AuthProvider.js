import * as React from 'react';

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
    init: false,
    pendingRefresh: null,
  });
  const [state, set_state] = React.useState(LoggedOutState);

  // console.debug('[AuthProvider]', { state });

  React.useEffect(() => {
    let timeoutId;

    async function checkExpires() {
      const { expires, expireThreshold } = state;

      if (expires instanceof Date) {
        const timeLeftMs = expires.getTime() - Date.now();

        // refresh token if within expireThreshold
        if (timeLeftMs < expireThreshold) {
          await refreshTokens();
        }

        // calculate time in ms until threshold
        const timeUntilThreshold = timeLeftMs - expireThreshold;
        // wait until threshold or ping at default frequency
        const nextTimeoutMs =
          timeUntilThreshold > 0 ? timeUntilThreshold : ExpireTimerFrequencyMs;

        // console.debug({
        //   timeLeftMs,
        //   expireThreshold,
        //   timeUntilThreshold,
        //   nextTimeoutMs,
        // });

        // call again near expire threshold
        timeoutId = setTimeout(checkExpires, nextTimeoutMs);
      }
    }

    // start checking expires
    checkExpires();

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, [state.expires]);

  async function setAuthentication(json) {
    const { jwtToken, loginRequestId } = json;
    const jwt = jwtToken.encoded;
    const expires = new Date(jwtToken.expires);
    const expireThreshold = ExpireDurationThreshold * (expires - Date.now());

    set_state({ ...state, loginRequestId, jwt, expires, expireThreshold });
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
      return json;
    }

    return null;
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
      const response = await fetch('/api/auth/refresh', { method: 'POST' });

      const json = await response.json();

      if (json.error) {
        await logout();
        return false;
      } else if (json.jwtToken) {
        return await setAuthentication(json);
      } else if (response.status === 200) {
        // no-op, no cookie no refresh
        return false;
      }

      console.error('[AuthProvider]', 'unrecognized refresh response', {
        response,
      });
      return false;
    }

    // set shared pendingRefresh
    instance.current.pendingRefresh = handleRefreshTokens();

    // wait shared pending refresh
    const result = await instance.current.pendingRefresh;

    // reset pendingRefresh back to null
    instance.current.pendingRefresh = null;

    return result;
  }

  const isLoggedIn = !!state.jwt;
  const value = {
    ...state,
    init: isLoggedIn || instance.current.init,
    isLoggedIn,
    actions: {
      logout,
      login,
      completeLogin,
      refreshTokens,
    },
  };

  // init with a refresh
  React.useEffect(async () => {
    await refreshTokens();
    instance.current.init = true;
  }, []);

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
