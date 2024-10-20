// Import necessary modules
const mongoose = require("mongoose");
const Note = require("../../../models/note_model");

/**
 * Syncs notes between the client and the server.
 *
 * This function handles the synchronization of notes by performing the following steps:
 * 1. Starts a MongoDB session and transaction.
 * 2. Processes each note from the client:
 *    - Updates existing notes if they have been modified.
 *    - Deletes notes if they are marked as deleted.
 *    - Creates new notes if they do not exist on the server.
 * 3. Retrieves paginated notes from the server based on the provided parameters.
 * 4. Commits the transaction and returns the synchronized notes to the client.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
const syncNotes = async (req, res) => {
    // Start a MongoDB session for transaction management
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Destructure necessary fields from the request body
        const { userId, notes, lastSyncTime, page = 1, limit = 10 } = req.body;

        // Validate required fields
        if (!userId) {
            throw new Error("User ID is required for syncing notes.");
        }

        // Process incoming notes if any are provided
        if (Array.isArray(notes) && notes.length > 0) {
            console.log('Processing incoming notes.');

            // Iterate through each note to synchronize
            for (const note of notes) {
                const {
                    _id,         // MongoDB ID of the note
                    localId,     // Local ID of the note (used for new notes)
                    title,
                    body,
                    folderIds,
                    updatedAt,
                    deleted,     // Flag indicating if the note is deleted
                    createdAt,
                    version      // Client-side version for concurrency control
                } = note;

                let existingNote = null;

                // Attempt to find the existing note by _id and userId
                if (_id) {
                    existingNote = await Note.findOne({ _id, ownerId: userId }).session(session);
                }

                // If not found by _id, try finding by localId and userId
                if (!existingNote && localId) {
                    existingNote = await Note.findOne({ localId, ownerId: userId }).session(session);
                }

                if (existingNote) {
                    if (deleted) {
                        console.log(`Deleting note with ID: ${existingNote._id}`);
                        // Delete the note if it's marked as deleted
                        await Note.deleteOne({ _id: existingNote._id, ownerId: userId }).session(session);
                        await Note.deleteOne({ localId: existingNote.localId, ownerId: userId }).session(session);

                    } else if (new Date(updatedAt) > new Date(existingNote.updatedAt)) {
                        console.log(`Updating note with ID: ${existingNote._id}`);

                        // Check for version conflicts to ensure data integrity
                        // if (version !== existingNote.version) {
                        //     throw new Error(`Version conflict for note: (${title}) ${_id} - provided version: ${version}, current version: ${existingNote.version}`);
                        // }

                        // Update note fields with new data
                        existingNote.title = title;
                        existingNote.body = body;
                        existingNote.updatedAt = updatedAt;
                        existingNote.folderIds = folderIds;
                        existingNote.createdAt = createdAt;
                        existingNote.version += 1; // Increment version for concurrency control

                        // Save the updated note
                        await existingNote.save({ session });
                    }
                } else if (!deleted) {
                    console.log('Creating a new note.');

                    // Create a new note if it does not exist and is not marked as deleted
                    const newNote = new Note({
                        localId,
                        ownerId: userId,
                        title,
                        body,
                        folderIds,
                        updatedAt,
                        createdAt,
                        version: version,
                    });

                    // Save the new note to the database
                    await newNote.save({ session });
                }
            }
        }

        // Calculate pagination parameters
        const currentPage = parseInt(page, 10) || 1;
        const itemsPerPage = parseInt(limit, 10) || 10;
        const skip = (currentPage - 1) * itemsPerPage;

        console.log(`Fetching notes for user ${userId}: Page ${currentPage}, Limit ${itemsPerPage}`);

        // Build the query to fetch updated notes since lastSyncTime if provided
        const notesQuery = { ownerId: userId };
        if (lastSyncTime) {
            console.log('Last sync was provided')
            notesQuery.updatedAt = { $gt: new Date(lastSyncTime) };
        }

        // Retrieve paginated notes from the database
        const [userNotes, totalNotesCount] = await Promise.all([
            Note.find(notesQuery)
                .sort({ updatedAt: -1 })    // Sort by newest first
                .skip(skip)                  // Skip documents for pagination
                .limit(itemsPerPage)         // Limit the number of documents fetched
                .session(session),
            Note.countDocuments(notesQuery)   // Get the total count for pagination
        ]);

        // Commit the transaction after successful operations
        await session.commitTransaction();
        session.endSession();

        // Respond with the synchronized notes and pagination details
        res.status(200).json({
            notes: userNotes,
            totalPages: Math.ceil(totalNotesCount / itemsPerPage),
            currentPage
        });
    } catch (error) {
        // Abort the transaction in case of any errors
        await session.abortTransaction();
        session.endSession();
        console.error('Error during notes synchronization:', error);

        // Respond with an error message
        res.status(500).json({ message: error.message });
    }
};

// Export the syncNotes function for use in other parts of the application
module.exports = syncNotes;
