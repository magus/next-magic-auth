import * as React from 'react';
import { useRouter } from 'next/router';

import Page from 'src/components/Page';
import Button from 'src/components/Button';
import TimeAgo from 'src/components/TimeAgo';
import { useAuth } from 'src/components/AuthProvider';
import { useModal } from 'src/components/Modal';
import graphql from 'src/client/graphql/queries';
import styles from 'styles/login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { email } = router.query;

  return (
    <Page className={styles.container}>
      <div className={styles.containerContent}>
        <LoginForm {...{ email }} />
      </div>
    </Page>
  );
}

function CheckEmailModal({ dismiss, id, phrase }) {
  const auth = useAuth();
  const [getMe, me] = graphql.me();
  const approved = graphql.watchLoginToken(id);

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
      <div>Use your phone to click the magic words in your email</div>
      <Button className={styles.magicWords}>{phrase}</Button>
    </div>
  );
}

function LoginRequests() {
  const loginRequests = graphql.loginRequests();

  console.debug({ loginRequests });

  return (
    <div className={styles.loginRequests}>
      <div className={styles.loginRequestsHeader}>Login Requests</div>
      <div className={styles.loginRequestsTable}>
        <table>
          <thead>
            <tr>
              <td></td>

              <td>Details</td>
            </tr>
          </thead>
          <tbody>
            {loginRequests.map((lr) => {
              return (
                <tr key={lr.id}>
                  <td>
                    {lr.approved ? (
                      '✅'
                    ) : (
                      <TimeAgo date={lr.expires}>
                        {(formattedDate, timeAgoData) => {
                          if (timeAgoData.isPast) {
                            return '❌';
                          }

                          return `⏳`;
                        }}
                      </TimeAgo>
                    )}
                  </td>

                  <td>
                    <TimeAgo date={lr.expires}>
                      {(formattedDate, timeAgoData) => {
                        if (timeAgoData.isPast) {
                          return 'Expired';
                        }

                        return `Expires ${formattedDate}`;
                      }}
                    </TimeAgo>{' '}
                    (
                    <TimeAgo date={lr.created}>
                      {(formattedDate, timeAgoData) => {
                        return `Created ${formattedDate}`;
                      }}
                    </TimeAgo>
                    )
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoginForm(props) {
  const auth = useAuth();
  const modal = useModal();
  const [getMe, me] = graphql.me();
  const [email, set_email] = React.useState('');

  React.useEffect(() => {
    if (!email && props.email) {
      set_email(props.email);
    }
  }, [props.email]);

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

  if (auth.isLoggedIn && me) {
    return (
      <>
        <h1 className={styles.email}>{me.email}</h1>

        <LoginRequests />

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
