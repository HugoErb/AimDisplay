const { contextBridge } = require('electron');

// Expose (sécurisé) une API au renderer si besoin
contextBridge.exposeInMainWorld('api', {
  ping: () => 'pong'
});
