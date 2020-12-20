import { useRouter } from 'next/router';

import styles from '../styles/login.module.css';

export default function Login() {
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();

    const { elements } = event.target;
    const email = elements.email.value;

    console.debug({ email });

    // make the login API call
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const json = await response.json();
    console.debug({ json });
  }

  return (
    <div className={styles.login}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input name="email" type="email" />
        <button>Log in</button>
      </form>
    </div>
  );
}
