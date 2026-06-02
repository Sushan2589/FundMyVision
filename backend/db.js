// db.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("users.db");
// console.log("Using database:", require("path").resolve("users.db"));

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT NOT NULL
)
`);

db.run(`
    CREATE TABLE ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    ideator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ideator_id)
    REFERENCES users(id)
);
    `)

db.run(`
    CREATE TABLE interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER NOT NULL,
    idea_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',

    UNIQUE(investor_id, idea_id),

    FOREIGN KEY (investor_id)
    REFERENCES users(id),

    FOREIGN KEY (idea_id)
    REFERENCES ideas(id)
);`)

db.run(`
    CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id)
    REFERENCES users(id),

    FOREIGN KEY (receiver_id)
    REFERENCES users(id)
);`)

module.exports = db;