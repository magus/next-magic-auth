# 🪄✨ next-magic-auth

https://magicwords.vercel.app/

**[magic email authentication for your nextjs app](https://magicwords.vercel.app/)**

- ✅ 🙈 No passwords
- ✅ 👋 No third parties (Say goodbye to Facebook, Google, etc.)
- ✅ 🔒 [Two-factor authentication](https://en.wikipedia.org/wiki/Multi-factor_authentication) (2FA) by default
- ✅ 💪 Secured with [JWT tokens](https://jwt.io/introduction)
- ✅ 🔥 Real-time login activty details
- ✅ 📧 Email only

> Inspired by [Magic](https://magic.link/)

# setup

This authentication can be added to any NextJS app by following the setup instructions below.

## secrets

In order for this package to function correctly, four mandatory environmental variables are required.

As you generate these values, copy them into a file named `.env.local` and be sure to add `.env.local` to your `.gitignore` file to ensure it is not accidentally committed to version control. You can find an example of this file in this repository called `.env`.

**Do not share or expose these values.**

For example, if you are using Vercel for your deployments you can [store it as a secret in Vercel](https://vercel.com/docs/environment-variables#secret-environment-variables).

1. `HASURA_ADMIN_SECRET`

   Secret password to access Hasura as an admin, used by backend to make authenticated GraphQL requests in order to create, update and verify authenticated login requests and sessions.

   Generate this value using a secure password tool

1. `JWT_SECRET`

   The secret key used to generate secured JSON web tokens. For example, we have a value of

   ```
   {
     "type":"HS512",
     "key": "zNZmbXfZuv/1cvMuieq9oW2ygtBOdJlu0x25Tyy0q9qkpNK6sa++Y2dj7z6xhTTa4mYuLfetsm6GfbKrkXkc9g=="
   }
   ```

   This means we use `HS512` as the hashing algorithm and the `key` is the actual secret value.

   You can use the commands and explanations below to generate a secure value for your use

   ```sh
   # output all system information
   uname -a
   # e.g. Linux magic-auth 5.4.0-51-generic #56-Ubuntu SMP Mon Oct 5 14:28:49 UTC 2020 x86_64 x86_64
   # NOTE: `x86_64` indicates 64-bit
   # we will select HS512 which uses SHA-512 since it is both
   #   1. more secure than SHA-256 and
   #   2. ~1.5x faster than SHA-256 on 64-bit systems (64-bit arithmetic internally)
   # for 512 bits of entropy for HS512, encoded as base64 (6 bits per character)
   # 512 / 6 = 85.33... characters ~= 86 characters
   # generate a random string with 512-bits (64-bytes) of entropy and encode in base64
   # this value will be our JWT_SECRET, used to sign our authentication keys and should be kept secure
   openssl rand -base64 64
   ```

1. `SENDGRID_API_KEY`

   Used to send emails to the login email address to authenticate login requests and sessions.

   [Signup for SendGrid](https://signup.sendgrid.com/) and [generate an API key](https://app.sendgrid.com/settings/api_keys) for use in this field.

1. `MAXMIND_LICENSE_KEY`

   [MaxMind GeoLite2](https://dev.maxmind.com/geoip/geoip2/geolite2/) is a free, open source set of IP geolocation databases which can be used to secure your login sessions and requests.

   Under [your account](https://www.maxmind.com/en/account) generate the license key under [**Services > My License Key**](https://www.maxmind.com/en/account)

With these three values prepared we can proceed with the rest of the setup.

## install

In your NextJS app you can now install the `next-magic-auth` package like you would normally for any dependency. The one important thing to note here is that you will need to specify the `MAXMIND_LICENSE_KEY` environmental variable for the `yarn install` `postinstall` step.

```sh
export MAXMIND_LICENSE_KEY="<api_key_above>"
yarn install
```

## route setup

In order to support login `next-magic-auth` certain API routes are required in your application. By creating these files located under `pages/api` in the NextJS project (see [NextJS API Routes](https://nextjs.org/docs/api-routes/introduction)). For example, the snippet below is used in the demo example for the login API route.

These routes can be located at whichever path you choose. These values will be configured in your client and in some configuration we set below. For the purposes of these instructions we will set them up as follows.

```
login           /api/auth/login
confirm         /api/auth/confirm
complete        /api/auth/complete
refresh         /api/auth/refresh
logout          /api/auth/logout

loginSendEmail  /api/events/loginSendEmail
```

## configuration

Now that we have included the required API routes, we should ensure all the configuration variables are set to the correct values. In general, sane defaults are chosen and you there are only a few which you **must** change, indicated with the ❗️, e.g. ❗️HOSTNAME.


| Config                          | Default                           | Description                                                                            |
| ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| ❗️HOSTNAME                      | `'magicwords.vercel.app'`         | Hostname of this application                                                           |

### server

| Config                          | Default                           | Description                                                                            |
| ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| ❗️EMAIL_FROM                    | `'magic@iamnoah.com'`             | Email from address, you must verify this sender in SendGrid                            |
| ❗️EMAIL_LOGIN_CONFIRM           | `'/api/auth/confirm'`             | The path to the `NextMagicAuth.API.Auth.confirm` route, setup in the route setup above |
| ❗️EMAIL_LOGIN_CONFIRM_REDIRECT  | `'/auth/confirm'`                 | The path to the page to show                                                           |

## postgres database

The authentication mechanisms rely on a centralized database to store the login metadata and active authenticated sessions. For this we use a [Hasura](https://hasura.io/), a GraphQL engine in front of a solid PostgreSQL database backend. To setup that databse backend, follow the steps below.

- Visit https://cloud.digitalocean.com/ and setup a new $5 droplet
- Select **Dokku** as a one-click app install during setup (this will save yourself some time setting it up later on)
- Setup an `A` DNS record for the **ip4v** address

  > For example, I setup an `A` record for `magic` that points to the **ip4v** address on Cloudflare

- Copy the **ipv4** address and replace `127.0.0.1` in the command below

  ```sh
  ssh root@127.0.0.1
  ```

- Once ssh'd into the droplet, run the commands below to setup Hasura and Postgres database

  ```sh
  # install dokku if you didn't select it during droplet setup
  # this will take about 10 minutes
  wget https://raw.githubusercontent.com/dokku/dokku/v0.22.2/bootstrap.sh;
  sudo DOKKU_TAG=v0.22.2 bash bootstrap.sh

  dokku apps:create hasura

  # install the postgres plugin
  # plugin installation requires root, hence the user change
  sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

  # setup hostname you should replace with the domain you would like to use
  dokku domains:add hasura magic-graphql.iamnoah.com

  # setup postgres database hasura-db
  dokku postgres:create hasura-db
  dokku postgres:link hasura-db hasura

  # after the above command completes you will see a DATABASE_URL that starts with postgres://
  # e.g. postgres://postgres:lwm7kumqjklqz6jubirf6u36n9zjo3zz@dokku-postgres-hasura-db:5432/hasura_db

  # <PG_PASSWORD>   password in the postgres link output above, e.g. lwm7kumqjklqz6jubirf6u36n9zjo3zz

  # <ADMIN_SECRET>  password to 1. access hasura admin console and 2. authenticate server side admin graphql queries
  #                 use a password tool to generate a strong secure password

  # <JWT_SECRET>    secret used to generate JWT tokens, generated in secrets section above

  # replace <PASSWORD> <ADMIN_SECRET> and <JWT_SECRET> in the command below
  dokku config:set hasura \
    HASURA_GRAPHQL_DATABASE_URL="postgres://postgres:<PG_PASSWORD>@dokku-postgres-hasura-db:5432/hasura_db" \
    HASURA_GRAPHQL_ADMIN_SECRET="<ADMIN_SECRET>" \
    HASURA_GRAPHQL_ENABLE_CONSOLE="true" \
    HASURA_GRAPHQL_JWT_SECRET='{"type":"HS512", "key": "<JWT_SECRET>"}' \
    HASURA_GRAPHQL_UNAUTHORIZED_ROLE="anonymous" \
    HASURA_GRAPHQL_ENABLED_APIS="graphql,metadata,pgdump"

  dokku proxy:ports-set hasura http:80:8080
  docker pull hasura/graphql-engine
  docker tag hasura/graphql-engine dokku/hasura
  dokku tags:deploy hasura

  # install letsencrypt plugin
  sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
  # configure letsencrypt with email
  dokku config:set --no-restart hasura DOKKU_LETSENCRYPT_EMAIL=letsencrypt@iamnoah.com
  # setup letsencrypt with hasura
  dokku letsencrypt hasura
  # setup automatic certificate renewal (daily)
  dokku letsencrypt:cron-job --add

  # you can setup a MAILTO to ensure errors are emailed to you
  # use a text editor to open the cron job
  sudo -u dokku vim /var/lib/dokku/plugins/available/letsencrypt/cron-job
  # add `MAILTO=your@email.tld` on the line above the PATH
  #
  # e.g.
  #   MAILTO="magic-dokku-letsencrypt@iamnoah.com"
  #   PATH=$PATH:/usr/local/bin
  #   dokku letsencrypt:auto-renew &>> /var/log/dokku/letsencrypt.log

  ```

- You should now be able to visit the Hasura admin console by navigating to the domain you setup above

  > e.g. https://magic-graphql.iamnoah.com/

- Now that you have confirmed everything is setup properly you can disable the admin console. Don't worry you can still access it locally but making it unavailable publically is a best practice for production.

  ```sh
  dokku config:set hasura HASURA_GRAPHQL_ENABLE_CONSOLE="false"
  ```

- Finally we setup the local `hasura` project folder to version control database metadata

  > https://hasura.io/docs/1.0/graphql/core/migrations/migrations-setup.html#migrations-setup

  ```sh
  # Create a directory with endpoint and admin secret configured
  hasura init hasura --endpoint https://magic-graphql.iamnoah.com
  export HASURA_GRAPHQL_ADMIN_SECRET=<ADMIN_SECRET>
  cd hasura
  hasura console
  # this will open a browser tab pointed at a local server running the hasura admin console
  ```

# Demo

This example uses Apollo to provide a graphql client we can use to talk to the authentication backend. This is used to interface with the Hasura GraphQL backend with the `next-magic-auth` generated token.

## Authentication flow

The authentication flow follows a consistent pattern to enforce security

1. Login request is generated by calling `/api/auth/login` with `email` field in the body

2. Email is sent via SendGrid with a link to `EMAIL_LOGIN_CONFIRM`

3. User clicks `EMAIL_LOGIN_CONFIRM` and is redirected to `EMAIL_LOGIN_CONFIRM_REDIRECT`

4. Page from **Step 1**, original login request, calls `auth.actions.complete`

5. `AuthProvider` calls `/api/auth/complete` to finish login

6. `/api/auth/complete` responds with `jwtToken`

At this point authentication values are stored in the `AuthProvider` React Context and available for use by any components using the `useAuth` hook, for example.

## Components

### AuthProvider

This React Context component is responsible for handling the authentication state, including transitioning between various states such as logged out and logged in by calling the authentication endpoints, e.g. `/api/auth/refresh`.

### AuthWatchLoginToken

Ensures the `loginToken` for this session exists, if it is revoked, logs out the session immediately, deleting all cookies.

### CheckEmailModal

Watch the login request (`loginToken`) and automatically transition once the login is approved (via clicking the link to `/api/auth/confirm` in an email).

## Hooks

### useAuth

This hook exposes the authentication state from the `AuthProvider` context provider to any component that uses it.

```js
const auth = useAuth();

if (auth.isLoggedIn) {
  return <div>...</div>;
}
```

# learn more

### flamegraphs

Use **[nodejs profiling](https://nodejs.org/en/docs/guides/simple-profiling/)** and **[flamebearer](https://github.com/mapbox/flamebearer)** to profile server code easily




```sh
# build a production build of the server that will be deployed
yarn build
# profile and run that build
NODE_ENV=production node --prof ./node_modules/.bin/next start
# this produces many isolate files with all the relevant (unprocessed) profile performance data
# the largest of these will contain the data for the server code
ls -Slh isolate*
# generate flamegraph.html and open it in the browser
node --prof-process --preprocess -j isolate-0x110008000-90734-v8.log | flamebearer
# use the search box to type the function name (e.g. the api route function name, e.g. auth/refresh)
```

### migrations

You can now use the admin console to create new tables, view and edit rows, etc. As you make changes they will be saved as migration files and can be applied to remote hasura instances as well allowing you to test and keep changes in sync across environments.

As you make migrations you can squash from a particular migration all the way up to the latest, keeping them concise to avoid many migration folders initially when making many changes to setup the database.

```sh
# Setup migration files for the first time by introspecting a server:
hasura migrate create "init" --from-server
```

```sh
# squash all migrations from version 1608459932016 to the latest
hasura migrate squash --from 1608459932016
```

You can use the migration under `hasura/migrations` to jump start your database with the models used by this demo. Be sure to replace https://magic-graphql.iamnoah.com with the domain you setup above.

```sh
hasura migrate apply --endpoint https://magic-graphql.iamnoah.com
```

### remote ssh tricks

Analyze disk usage

```sh
sudo apt-get install ncdu
sudo ncdu /
```

### sql

View all databases

```sql
SELECT datname FROM pg_database
WHERE datistemplate = false;
```

View size of database in human friendly bytes

```sql
SELECT pg_size_pretty(pg_database_size('hasura_db'))
```
