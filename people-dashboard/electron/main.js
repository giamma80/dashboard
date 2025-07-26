import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Crea la finestra principale dell'app
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../build/icon.png'),
    titleBarStyle: 'default',
    show: false // Non mostrare finché non è pronta
  });

  // Carica l'app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    // Apri DevTools in sviluppo
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Mostra la finestra quando è pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus sulla finestra (macOS)
    if (process.platform === 'darwin') {
      mainWindow.focus();
    }
  });

  // Gestisci la chiusura della finestra
  mainWindow.on('closed', () => {
    // Su macOS le app rimangono attive anche quando tutte le finestre sono chiuse
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  return mainWindow;
}

// Questo metodo sarà chiamato quando Electron ha finito l'inizializzazione
app.whenReady().then(() => {
  createWindow();

  // Su macOS, ri-crea una finestra quando l'icona del dock viene cliccata
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Chiudi l'app quando tutte le finestre sono chiuse (eccetto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Menu personalizzato (opzionale)
app.whenReady().then(() => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Carica CSV',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // Qui potresti implementare un dialog per caricare file
          }
        },
        { type: 'separator' },
        {
          label: 'Esci',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Visualizza',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Finestra',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // Su macOS, il primo elemento del menu è sempre il nome dell'app
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});
