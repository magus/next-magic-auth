import * as React from 'react';
import { useRouter } from 'next/router';

import Page from 'src/components/Page';
import Button from 'src/components/Button';
import { useAuth } from 'src/components/AuthProvider';

import styles from 'styles/Login.module.css';

LoginPage.title = 'Login';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { email } = router.query;

  // console.debug('[LoginPage]', { auth });

  return (
    <Page className={styles.container}>
      <div className={styles.containerContent}>
        {auth.isLoggedIn ? <Button onClick={auth.actions.logout}>Logout</Button> : <LoginForm {...{ email }} />}
      </div>
    </Page>
  );
}

function LoginForm(props) {
  const auth = useAuth();
  const [email, set_email] = React.useState('');

  React.useEffect(() => {
    if (!email && props.email) {
      set_email(props.email);
    }
  }, [props.email]);

  async function handleSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const email = elements.email.value;

    // make the login API call
    await auth.actions.login(email);
  }

  async function handleEmailInput(event) {
    set_email(event.target.value);
  }

  const buttonStyles = email ? styles.loginButtonEnabled : styles.loginButton;

  return (
    <>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <input
          id="email"
          className={styles.loginInput}
          name="email"
          type="email"
          placeholder="magic@gmail.com"
          value={email}
          onChange={handleEmailInput}
        />
        <label htmlFor="email" className={styles.loginLabel}>
          Email
        </label>

        <Button className={buttonStyles}>Login</Button>
      </form>
    </>
  );
}
