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

  return { settingsPath, settings: true };
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
    await handleCron();
    const task = createCron(1, handleCron);
    globalCronTask = task;

    return data;
  } catch (err) {
    return false;
  }
});

// Destroy Connector
ipcMain.handle('destroyConnector', async () => {
  await globalCronTask.stop();
});
