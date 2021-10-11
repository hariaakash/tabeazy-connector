const axios = require('axios');
const store = require('./store');

const { NODE_ENV } = process.env;
const production = NODE_ENV === 'production';

const server = production ? 'pro' : 'dev';
const baseURL = `https://backend.${server}.tabeazy.com/seller/connector/`;

const instance = axios.create({ baseURL });

const authInterceptor = (config) => {
  const newConfig = { ...config };
  const token = store.get('token');
  newConfig.headers['x-api-key'] = token;
  return newConfig;
};

instance.interceptors.request.use(authInterceptor);

module.exports = instance;
