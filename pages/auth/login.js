import * as React from 'react';
import { useRouter } from 'next/router';

import Page from 'components/Page';
import Button from 'components/Button';
import { useModal } from 'components/Modal';
import graphql from 'src/client/graphql/queries';
import styles from 'styles/login.module.css';

export default function LoginPage() {
  return (
    <Page className={styles.container}>
      <div className={styles.containerContent}>
        <LoginForm />
      </div>
    </Page>
  );
}

function CheckEmailModal({ dismiss, userId, phrase }) {
  const [getMe, me] = graphql.me();
  const approved = graphql.watchLoginToken(userId);

  React.useEffect(async () => {
    if (approved) {
      const response = await fetch('/api/auth/complete', {
        method: 'POST',
      });
      if (response.status === 200) {
        getMe();
        dismiss();
      }
    }
  }, [approved]);

  async function handleLoginComplete() {}

  return (
    <div className={styles.checkEmailModal}>
      <div className={styles.checkEmailModalKeepThisTab}>
        Keep this tab open
      </div>
      <div>Click the magic words in your email</div>
      <Button className={styles.magicWords}>{phrase}</Button>

      {JSON.stringify(approved, null, 2)}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const modal = useModal();
  const [getMe, me] = graphql.me();
  const [email, set_email] = React.useState('');

  React.useEffect(() => {
    getMe();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const email = elements.email.value;

    // make the login API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.status === 200) {
      const json = await response.json();
      modal.open(CheckEmailModal, {
        props: json,
        disableBackgroundDismiss: true,
      });
    }
  }

  async function handleLogout() {
    return new Promise((resolve) => {
      // resolve(true);

      fetch('/api/auth/logout', {
        method: 'POST',
      }).then((response) => {
        window.location = '/';
      });
    });
  }

  async function handleEmailInput(event) {
    set_email(event.target.value);
  }

  const buttonStyles = email ? styles.loginButtonEnabled : styles.loginButton;

  if (me) {
    return (
      <>
        {JSON.stringify(me, null, 2)}
        <Button className={styles.button} onClick={handleLogout}>
          Logout
        </Button>
      </>
    );
  }

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
        <Button className={buttonStyles}>Login</Button>
      </form>
    </>
  );
}
