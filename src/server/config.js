const {
  HASURA_ADMIN_SECRET,

  USER_DB_SCHEMA_NAME,
  USER_FIELDS,

  JWT_SECRET,
  JWT_REFRESH_TOKEN_EXPIRES,
  JWT_TOKEN_EXPIRES,
  LOGIN_TOKEN_EXPIRES,

  SENDGRID_API_KEY,
  EMAIL_FROM,
} = process.env;

exports.HASURA_ADMIN_SECRET = HASURA_ADMIN_SECRET;

exports.USER_DB_SCHEMA_NAME = USER_DB_SCHEMA_NAME || 'public';
// e.g. user,self
exports.USER_FIELDS = USER_FIELDS ? USER_FIELDS.split(',') : [];

// e.g. '{"type":"HS256", "key": "zNZmbXfZuv/1cvMuieq9oW2ygtBOdJlu0x25Tyy0q9qkpNK6sa++Y2dj7z6xhTTa4mYuLfetsm6GfbKrkXkc9g=="}'
exports.JWT_SECRET = JWT_SECRET ? JSON.parse(JWT_SECRET) : {};

// in minutes
exports.JWT_REFRESH_TOKEN_EXPIRES = JWT_REFRESH_TOKEN_EXPIRES || 60 * 24 * 365; // expire refresh token after 365 days
exports.JWT_TOKEN_EXPIRES = JWT_TOKEN_EXPIRES || 15; // expire token after 15 min
exports.LOGIN_TOKEN_EXPIRES = LOGIN_TOKEN_EXPIRES || 60 * 2; // expire login token after 2 hours

exports.SENDGRID_API_KEY = SENDGRID_API_KEY;
// verified sender on sendgrid
exports.EMAIL_FROM = EMAIL_FROM || 'magic@iamnoah.com';

if (!HASURA_ADMIN_SECRET) throw new Error('HASURA_ADMIN_SECRET is not defined');
if (!SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is not defined');
