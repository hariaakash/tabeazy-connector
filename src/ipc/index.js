const { app, ipcMain } = require('electron');
const fse = require('fs-extra');
const _ = require('lodash');
const log = require('electron-log');

const store = require('../helpers/store');
const axios = require('../helpers/axios');
const createCron = require('../helpers/cron');
const handleEvents = require('../helpers/events');

const appDataPath = app.getPath('appData');
const settingsPath = `${appDataPath}/tabeazy-connector/settings.json`;

let globalCronTask;

// Check for settings file
ipcMain.handle('checkForSettingsFile', async () => {
  await fse.ensureFile(settingsPath);
  store.set('settingsPath', settingsPath);
  store.set('appData', `${appDataPath}/tabeazy-connector`);
});

// Check for integrity of settings file
ipcMain.handle('checkForSettingsIntegrity', async () => {
  try {
    const settings = await fse.readJSON(settingsPath);
    const keysRequired = ['token', 'software', 'config'].sort();
    const keysPresent = Object.keys(settings).sort();

    if (!_.isEqual(keysRequired, keysPresent)) return false;

    keysRequired.forEach((x) => {
      store.set(x, settings[x]);
    });
    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
});

const handleCron = async () => {
  log.log('cron');
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
    log.error(err);
    return false;
  }
});

// Destroy Connector
ipcMain.handle('destroyConnector', async () => {
  await globalCronTask.stop();
});
