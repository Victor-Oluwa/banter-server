const express = require('express');
const syncNotes = require('../controller/ctrl.sync.notes');
const syncFolders = require('../controller/ctrl.sync.folders');

const noteRouter = express.Router();


noteRouter.post('/sync-notes', syncNotes);
noteRouter.post('/sync-folders', syncFolders);

module.exports = noteRouter;

