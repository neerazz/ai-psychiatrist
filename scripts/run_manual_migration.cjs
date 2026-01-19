const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'memory_directory', 'databases', 'sessions.db');

console.log('Migrating database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found!');
    process.exit(1);
}

const db = new Database(dbPath);

console.log('Adding focus_areas column...');
try {
    db.prepare('ALTER TABLE patients ADD COLUMN focus_areas TEXT').run();
    console.log('Success: focus_areas added');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Skipped: focus_areas already exists');
    } else {
        console.error('Error adding focus_areas:', err.message);
    }
}

console.log('Adding todos column...');
try {
    db.prepare('ALTER TABLE patients ADD COLUMN todos TEXT').run();
    console.log('Success: todos added');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Skipped: todos already exists');
    } else {
        console.error('Error adding todos:', err.message);
    }
}

console.log('Updating defaults...');
db.prepare("UPDATE patients SET focus_areas = '[]' WHERE focus_areas IS NULL").run();
db.prepare("UPDATE patients SET todos = '[]' WHERE todos IS NULL").run();

console.log('Migration complete.');
db.close();
