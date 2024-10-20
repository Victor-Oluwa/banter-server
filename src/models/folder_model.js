const mongoose = require('mongoose');

const folderSchema = mongoose.Schema({
    folderName: { required: true, type: String },
    localId: { required: true, type: String },
    createdAt: { required: true, type: Date },
    updatedAt: { required: true, type: Date },
    ownerId: { required: true, type: String },
    ownerId: { required: true, type: String },
    version: { type: Number, default: 0 },  // Version for Optimistic Concurrency Control
});

// compound index to optimize query performance
folderSchema.index({ ownerId: 1, updatedAt: -1 });

const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;
