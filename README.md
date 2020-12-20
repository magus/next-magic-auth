
# next-magic-auth

# demo

# setup

## postgres database
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
dokku domains:add hasura magic.iamnoah.com

# setup postgres database hasura-db
dokku postgres:create hasura-db
dokku postgres:link hasura-db hasura

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
# this value will be our JWT secret, used to sign our authentication keys and should be kept secure
openssl rand -base64 64

# after the above command completes you will see a DATABASE_URL that starts with postgres://
# e.g. postgres://postgres:lwm7kumqjklqz6jubirf6u36n9zjo3zz@dokku-postgres-hasura-db:5432/hasura_db
# PASSWORD  lwm7kumqjklqz6jubirf6u36n9zjo3zz
# SECRET    Use a password tool to generate a strong secure password, this will be used to access the admin console
# KEY       Generated as output of openssl command above
# replace <PASSWORD> <SECRET> and <KEY> in the command below
dokku config:set hasura \
  HASURA_GRAPHQL_DATABASE_URL="postgres://postgres:<PASSWORD>@dokku-postgres-hasura-db:5432/hasura_db" \
  HASURA_GRAPHQL_ADMIN_SECRET="<SECRET>" \
  HASURA_GRAPHQL_ENABLE_CONSOLE="true" \
  HASURA_GRAPHQL_JWT_SECRET='{"type":"HS256", "key": "<KEY>"}' \
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
```

You should now be able to visit the Hasura admin console by navigating to the domain you setup above

    > e.g. https://magic.iamnoah.com/
