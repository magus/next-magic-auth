import * as React from 'react';
import { useRouter } from 'next/router';

import graphql from '../../src/client/graphql';
import styles from '../../styles/login.module.css';

export default function Login() {
  const router = useRouter();
  const [phrase, set_phrase] = React.useState(null);
  const [user, set_user] = React.useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const email = elements.email.value;

    // make the login API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const json = await response.json();
    set_phrase(json.phrase);
  }

  async function handleLoginComplete() {
    const response = await fetch('/api/auth/complete', {
      method: 'POST',
    });
  }

  async function handleLogout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    });
  }

  async function handleRefreshToken() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
    });

    if (response.status === 200) {
      const me = await graphql.me();
      set_user(me);
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <label className={styles.loginLabel} htmlFor="email">
          Email
        </label>
        <input
          className={styles.loginInput}
          name="email"
          type="email"
          placeholder="magic@gmail.com"
        />
        <button className={styles.loginButton}>Login</button>
      </form>

      <div>{phrase}</div>

      <button onClick={handleLoginComplete}>Complete Login</button>
      <button onClick={handleRefreshToken}>Refresh</button>
      <button onClick={handleLogout}>Logout</button>

      {JSON.stringify(user, null, 2)}
    </div>
  );
}
