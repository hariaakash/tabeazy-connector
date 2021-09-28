const { app, ipcMain } = require('electron');
const fse = require('fs-extra');
const _ = require('lodash');

const store = require('../helpers/store');
const axios = require('../helpers/axios');
const createCron = require('../helpers/cron');

const appDataPath = app.getPath('appData');
const settingsPath = `${appDataPath}/tabeazy-connector/settings.json`;

let globalCronTask;

// Check for settings file
ipcMain.handle('checkForSettingsFile', async () => {
  const settings = await fse.pathExists(settingsPath);
  return { settingsPath, settings };
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

const sendEvents = async () => {
  console.log('cron');
};

// Check API key by fetching seller
ipcMain.handle('fetchSeller', async () => {
  try {
    const { data } = await axios.get('');
    const task = createCron(1, sendEvents);
    globalCronTask = task;

    return data;
  } catch (err) {
    return false;
  }
});

// Check API key by fetching seller
// ipcMain.handle('fetchSeller', async (event) => {
//   try{
//     const { data } = await axios.get('')
//     const task = createCron(5, sendEvents)
//     console.log(task)
//     return data
//   } catch (err) {
//     return false
//   }
// })
