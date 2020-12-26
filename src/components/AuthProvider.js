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

export function AuthProvider({ children }) {
  const [state, set_state] = React.useState(LoggedOutState);

  React.useEffect(() => {
    let timeoutId;

    function checkExpires() {
      if (state.expires instanceof Date) {
        const timeLeftMs = state.expires.getTime() - Date.now();
        console.debug({ timeLeftMs });
      }

      // call again
      timeoutId = setTimeout(checkExpires, ExpireTimerFrequencyMs);
    }

    // start checking expires
    checkExpires();

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, [state.expires]);

  async function setJWTToken(jwtToken) {
    const jwt = jwtToken.encoded;
    const expires = new Date(jwtToken.expires);

    set_state({ ...state, jwt, expires });
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
        await setJWTToken(json.jwtToken);
      }
    }
  }

  async function refreshTokens() {
    // skip on server
    if (!process.browser) return;

    const response = await fetch('/api/auth/refresh', { method: 'POST' });
    if (response.status === 200) {
      const json = await response.json();
      if (json.jwtToken) {
        await setJWTToken(json.jwtToken);
      }
    } else {
      await logout();
    }

    return false;
  }

  const value = {
    ...state,
    isLoggedIn: !!state.jwt,
    actions: {
      logout,
      login,
      completeLogin,
      refreshTokens,
    },
  };

  // init with a refresh
  React.useEffect(refreshTokens, []);

  return <AuthContext.Provider {...{ value }}>{children}</AuthContext.Provider>;
}
