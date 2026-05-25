"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  getLocalApiUrl: () => "https://scroll-pop.onrender.com",
  getVersion: () => electron.ipcRenderer.invoke("app:version"),
  checkForUpdates: () => electron.ipcRenderer.invoke("updater:check"),
  onUpdateAvailable: (cb) => electron.ipcRenderer.on("update-available", (_e, info) => cb(info)),
  onUpdateDownloaded: (cb) => electron.ipcRenderer.on("update-downloaded", (_e, info) => cb(info)),
  installUpdate: () => electron.ipcRenderer.invoke("updater:install")
});
