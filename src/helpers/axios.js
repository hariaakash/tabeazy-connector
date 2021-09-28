const axios = require('axios');
const store = require('./store');

const baseURL = process.env.VUE_APP_API_URL;

const instance = axios.create({ baseURL });

const authInterceptor = (config) => {
  const token = store.get('token');
  config.headers['x-api-key'] = token;
  return config;
};

instance.interceptors.request.use(authInterceptor);

module.exports = instance;
