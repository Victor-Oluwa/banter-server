const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
    title: { required: true, type: String },
    localId: { required: true, type: String },
    createdAt: { required: true, type: Date },
    updatedAt: { required: true, type: Date },
    body: { type: Array, required: true },
    folderIds: { type: Array, required: true },
    ownerId: { type: String, required: true },
    version: { type: Number, default: 0 },  // Version for Optimistic Concurrency Control
});

// compound index to optimize query performance
noteSchema.index({ ownerId: 1, updatedAt: -1 });

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
