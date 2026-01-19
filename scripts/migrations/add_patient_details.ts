
import { sqliteManager } from '../../src/database/sqlite.js';
import { logger } from '../../src/utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    logger.info('Starting migration: Add patient details columns...');

    try {
        const db = sqliteManager.getDb();

        // 1. Add focus_areas column
        try {
            db.prepare('ALTER TABLE patients ADD COLUMN focus_areas TEXT').run();
            logger.info('Added focus_areas column');
        } catch (error: any) {
            if (error.message.includes('duplicate column name')) {
                logger.info('focus_areas column already exists');
            } else {
                throw error;
            }
        }

        // 2. Add todos column
        try {
            db.prepare('ALTER TABLE patients ADD COLUMN todos TEXT').run();
            logger.info('Added todos column');
        } catch (error: any) {
            if (error.message.includes('duplicate column name')) {
                logger.info('todos column already exists');
            } else {
                throw error;
            }
        }

        // 3. Update existing records with default empty arrays if null
        db.prepare(`
            UPDATE patients 
            SET focus_areas = '[]' 
            WHERE focus_areas IS NULL
        `).run();

        db.prepare(`
            UPDATE patients 
            SET todos = '[]' 
            WHERE todos IS NULL
        `).run();
        logger.info('Initialized default values for new columns');

        logger.info('Migration completed successfully');
    } catch (error) {
        logger.error('Migration failed', { error });
        process.exit(1);
    }
}

migrate();
