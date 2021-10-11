const { app, ipcMain } = require('electron');
const fse = require('fs-extra');
const _ = require('lodash');

const store = require('../helpers/store');
const axios = require('../helpers/axios');
const createCron = require('../helpers/cron');
const handleEvents = require('../helpers/events');

const appDataPath = app.getPath('appData');
const settingsPath = `${appDataPath}/tabeazy-connector/settings.json`;

let globalCronTask;

// Check for settings file
ipcMain.handle('checkForSettingsFile', async () => {
  const settings = await fse.pathExists(settingsPath);
  if (!settings) await fse.ensureFile(settingsPath);
  store.set('settingsPath', settingsPath);
  store.set('appData', `${appDataPath}/tabeazy-connector`);

  return { settingsPath, settings: true };
});

// Check for integrity of settings file
ipcMain.handle('checkForSettingsIntegrity', async () => {
  try {
    const settings = await fse.readJSON(settingsPath);
    const api = process.env.VUE_APP_API_URL;
    const keysRequired = ['token', 'software', 'config'].sort();
    const keysPresent = Object.keys(settings).sort();

    if (!_.isEqual(keysRequired, keysPresent)) return false;

    keysRequired.forEach((x) => {
      store.set(x, settings[x]);
    });
    store.set('api', api);
    return true;
  } catch (err) {
    return false;
  }
});

const handleCron = async () => {
  console.log('cron');
  await handleEvents({ store, axios });
};

// Check API key by fetching seller
ipcMain.handle('fetchSeller', async () => {
  try {
    const { data } = await axios.get('');
    const { cron = 5 } = data.seller.connector;
    await handleCron();
    const task = createCron(cron, handleCron);
    globalCronTask = task;

    return data;
  } catch (err) {
    console.log(err);
    return false;
  }
});

// Destroy Connector
ipcMain.handle('destroyConnector', async () => {
  await globalCronTask.stop();
});
