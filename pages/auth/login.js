import * as React from 'react';
import { useRouter } from 'next/router';

import Page from 'components/Page';
import { useModal } from 'components/Modal';
import graphql from 'src/client/graphql/queries';
import styles from 'styles/login.module.css';

export default function LoginPage() {
  return (
    <Page className={styles.container}>
      <LoginForm />
    </Page>
  );
}

function CheckEmailModal({ phrase }) {
  return (
    <div className={styles.checkEmailModal}>
      <div className={styles.checkEmailModalKeepThisTab}>
        Keep this tab open
      </div>
      <div>Click the magic words in your email</div>
      <div className={styles.magicWords}>{phrase}</div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const modal = useModal();
  const [getMe, me] = graphql.me();
  const [email, set_email] = React.useState('');
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
      getMe();
    }
  }

  async function handleOpenModal() {
    modal.open(() => <CheckEmailModal phrase="test phrase" />, {
      disableBackgroundDismiss: true,
    });
  }

  async function handleEmailInput(event) {
    set_email(event.target.value);
  }

  const buttonStyles = email ? styles.loginButtonEnabled : styles.loginButton;

  return (
    <>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <label className={styles.loginLabel} htmlFor="email">
          Email
        </label>
        <input
          className={styles.loginInput}
          name="email"
          type="email"
          placeholder="magic@gmail.com"
          value={email}
          onChange={handleEmailInput}
        />
        <button className={buttonStyles}>Login</button>
      </form>

      <div>{phrase}</div>

      <button onClick={handleLoginComplete}>Complete Login</button>
      <button onClick={handleRefreshToken}>Refresh</button>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleOpenModal}>Open Modal</button>

      {JSON.stringify(me, null, 2)}
    </>
  );
}
