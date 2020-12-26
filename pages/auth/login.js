import * as React from 'react';
import { useRouter } from 'next/router';

import Page from 'components/Page';
import Button from 'components/Button';
import { useAuth } from 'components/AuthProvider';
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
  const auth = useAuth();
  const [getMe, me] = graphql.me();
  const approved = graphql.watchLoginToken(userId);

  React.useEffect(async () => {
    if (approved) {
      await auth.actions.completeLogin();
    }
  }, [approved]);

  React.useEffect(() => {
    if (auth.isLoggedIn) {
      getMe();
    }
  }, [auth.isLoggedIn]);

  React.useEffect(() => {
    if (me) {
      dismiss();
    }
  }, [me]);

  return (
    <div className={styles.checkEmailModal}>
      <div className={styles.checkEmailModalKeepThisTab}>
        Keep this tab open
      </div>
      <div>Click the magic words in your email</div>
      <Button className={styles.magicWords}>{phrase}</Button>
    </div>
  );
}

function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const modal = useModal();
  const [getMe, me] = graphql.me();
  const [email, set_email] = React.useState('');

  React.useEffect(() => {
    if (auth.isLoggedIn) {
      getMe();
    }
  }, [auth.isLoggedIn]);

  async function handleSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const email = elements.email.value;

    // make the login API call
    const json = await auth.actions.login(email);
    if (json) {
      modal.open(CheckEmailModal, {
        props: json,
        disableBackgroundDismiss: true,
      });
    }
  }

  async function handleEmailInput(event) {
    set_email(event.target.value);
  }

  const buttonStyles = email ? styles.loginButtonEnabled : styles.loginButton;

  if (auth.isLoggedIn) {
    return (
      <>
        <pre>{JSON.stringify(me, null, 2)}</pre>
        <Button onClick={() => getMe()}>Get Me</Button>
        <Button className={styles.button} onClick={auth.actions.logout}>
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
