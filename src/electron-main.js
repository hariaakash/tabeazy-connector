// This intercepts the error message box shown by Electron in case of an uncaughtException. Needs to be on top of the main process.
process.on('uncaughtException', (err) => {
  console.error(err);
});

const {
  app, BrowserWindow, Tray, Menu,
} = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');

require('./ipc');

// Get and switch Vuelectro build type
process.env.VUELECTRO_ENV = process.env.VUELECTRO_ENV || 'build';

// Set global variables for the resource path and Vue static path to be used throughout the app (both in main and renderer)
global.__resPath = path.join(process.cwd(), 'resources');
global.__staticPath = path.join(process.cwd(), 'public');

let rndURL = `file://${__dirname}/renderer/index.html`; // Renderer entry URL
let isDev = false; // Set the Electron environment to development or production
let win;
let isQuiting;
let tray;

// Change running environment and renderer source according to the executed command
switch (process.env.VUELECTRO_ENV) {
  case 'run':
  case 'devprod':
    isDev = true;
    break;
  case 'serve':
    isDev = true;
    rndURL = 'http://localhost:8080/';
    break;
  case 'build':
    global.__resPath = process.resourcesPath;
    global.__staticPath = path.join(__dirname, 'renderer');
    break;
  default:
    break;
}

function createWindow() {
  // Tray
  tray = new Tray(path.join(__staticPath, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        win.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [
        JSON.stringify({
          VUELECTRO_RES_PATH: __resPath,
          VUELECTRO_STATIC_PATH: __staticPath,
          VUELECTRO_ENV: process.env.VUELECTRO_ENV,
        }),
      ],
    },
    icon: path.join(__staticPath, 'icon.png'),
  });

  win.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
      event.returnValue = false;
    }
  });

  // Use the promise returned by loadURL() in combination with show:false and win.show() to avoid showing the window before content is loaded
  win.loadURL(rndURL).then(() => {
    win.show();
    if (isDev) win.webContents.openDevTools(); // Open dev tools on development mode
  });

  autoUpdater.on('update-downloaded', () => {
    setImmediate(() => {
      autoUpdater.quitAndInstall();
    });
  });

  // Auto Updater
  win.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('ready', async () => {
  if (isDev) {
    // Install Vue Devtools
    try {
      await require('electron-devtools-installer').default({
        id: 'ljjemllljcmogpfapbkkighbhhppjdbg', // Vue Devtools beta
        electron: '>=1.2.1',
      });
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }

  // Auto Launch / Startup
  const autoLaunch = new AutoLaunch({ name: 'Tabeazy Connector' });
  autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.enable();
  });

  createWindow();
});

// Prevent app from hanging around if all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// End main process if Electron instance has already been terminated
app.on('quit', () => {
  process.exit();
});

app.on('before-quit', () => {
  isQuiting = true;
});
