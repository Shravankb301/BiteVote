import clientPromise from './mongodb';

export async function ensureIndexes() {
    try {
        const client = await clientPromise;
        const db = client.db('team-lunch-decider');

        // Create indexes for the sessions collection
        await db.collection('sessions').createIndex(
            { code: 1 },
            { 
                unique: true,
                background: true,
                name: 'sessions_code_unique'
            }
        );

        // Create compound index for votes collection
        await db.collection('votes').createIndex(
            { sessionId: 1, restaurantId: 1 },
            { 
                unique: true,
                background: true,
                name: 'votes_session_restaurant_unique'
            }
        );

        // Create index for vote lookups
        await db.collection('votes').createIndex(
            { sessionId: 1, votedBy: 1 },
            { 
                background: true,
                name: 'votes_session_user_lookup'
            }
        );

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Failed to create indexes:', error);
        throw error;
    }
}

// Function to be called during app initialization
export async function initializeDatabase() {
    try {
        await ensureIndexes();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        // Don't throw here - let the app continue even if index creation fails
    }
} 