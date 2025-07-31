// Preload script per sicurezza e debugging
const { contextBridge } = require('electron');

// Esponi solo funzioni sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Funzioni per debugging/info dell'app
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,
  getArch: () => process.arch,
  
  // Log di debug per verificare che tutto funzioni
  log: (message) => console.log('Renderer:', message)
});

// Log di debug per verificare che il preload funzioni
console.log('Preload script loaded successfully');
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
