const { NODE_ENV } = process.env;

exports.NODE_ENV = NODE_ENV || 'production';

const isProd = NODE_ENV === 'production';
const isDev = !isProd;

exports.__DEV__ = isDev;
exports.__PROD__ = isProd;
