const mongoose = require("mongoose");
const Folder = require("../../../models/folder_model");

const syncFolders = async (req, res) => {
    const session = await mongoose.startSession();  // Start a session for transaction
    session.startTransaction();  // Begin transaction

    try {
        const { userId, folders, lastSyncTime, page, limit } = req.body;  // Pagination inputs

        if (folders && folders.length > 0) {
            for (const folder of folders) {
                const {
                    folderName,
                    mongoId,   // MongoDB ID of the note in the database
                    updatedAt,
                    id,        // Local ID of the note (used if a new note is created)
                    deleted,   // Flag indicating if the note is deleted
                    createdAt,
                    version    // Client-side version for concurrency control
                } = folder;

                // Find the existing note based on mongoId and ownerId
                const existingFolder = await Note.findOne({ _id: mongoId, ownerId: userId }).session(session);

                if (existingFolder) {
                    if (deleted) {
                        // If note is marked as deleted, remove it from the database
                        await Folder.deleteOne({ _id: mongoId, ownerId: userId }).session(session);
                    } else if (new Date(updatedAt) > new Date(existingFolder.updatedAt)) {
                        // Ensure no version conflicts before updating (optimistic concurrency control)
                        if (version !== existingFolder.version) {
                            throw new Error(`Version conflict for folder ${mongoId}`);
                        }

                        // Update the note if the local one is newer
                        existingFolder.folderName = folderName;
                        existingFolder.updatedAt = updatedAt;
                        existingFolder.createdAt = createdAt;
                        existingFolder.version += 1;  // Increment version for concurrency control

                        await existingFolder.save({ session });
                    }
                } else if (!deleted) {
                    // If the note doesn't exist and it's not marked as deleted, insert a new note
                    const newFolder = new Folder({
                        localId: id,  // Local ID provided by the client
                        ownerId: userId,
                        folderName,
                        updatedAt,
                        createdAt,
                        version: 1  // Initialize version as 1 for new notes
                    });
                    await newFolder.save({ session });
                }
            }
        }

        // Pagination variables: skip the first (page - 1) * limit items
        const skip = (page - 1) * limit;

        // Fetch notes with pagination and based on lastSyncTime (if provided)
        let folderQuery = { ownerId: userId };
        if (lastSyncTime) {
            folderQuery.updatedAt = { $gt: new Date(lastSyncTime) };
        }

        // Fetch paginated notes from the database
        const userFolders = await Note.find(folderQuery)
            .sort({ updatedAt: -1 })  // Sort by updatedAt in descending order (newest first)
            .skip(skip)  // Skip documents for pagination
            .limit(limit)  // Limit the number of documents fetched
            .session(session);

        const totalFoldersCount = await Note.countDocuments(notesQuery);  // Total notes for pagination

        await session.commitTransaction();  // Commit the transaction after successful operation
        session.endSession();

        // Send the paginated notes and pagination info to the client
        res.status(200).json({
            notes: userFolders,
            totalPages: Math.ceil(totalFoldersCount / limit),
            currentPage: page,
        });

    } catch (error) {
        // Abort the transaction and roll back changes if an error occurs
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: "Error syncing folders" });
    }
};

module.exports = syncFolders;