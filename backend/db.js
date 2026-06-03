const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

db.serialize(() => {

  // USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // INVESTOR PROFILES
  db.run(`
    CREATE TABLE IF NOT EXISTS investor_profiles (
      user_id INTEGER PRIMARY KEY,
      company_name TEXT,
      bio TEXT,
      industries TEXT,
      min_investment REAL,
      max_investment REAL,

      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // IDEATOR PROFILES
  db.run(`
    CREATE TABLE IF NOT EXISTS ideator_profiles (
      user_id INTEGER PRIMARY KEY,
      bio TEXT,
      skills TEXT,
      location TEXT,

      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // IDEAS
  db.run(`
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      description TEXT NOT NULL,
      category TEXT,
      stage TEXT,
      funding_needed REAL,
      visibility TEXT DEFAULT 'public',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // INTERESTS
  db.run(`
    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id INTEGER NOT NULL,
      investor_id INTEGER NOT NULL,
      message TEXT,
      amount REAL,
      status TEXT DEFAULT 'pending',

      UNIQUE(idea_id, investor_id),

      FOREIGN KEY (idea_id) REFERENCES ideas(id),
      FOREIGN KEY (investor_id) REFERENCES users(id)
    )
  `);

  // CONVERSATIONS
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id INTEGER NOT NULL,
      investor_id INTEGER NOT NULL,

      UNIQUE(idea_id, investor_id),
      FOREIGN KEY (idea_id) REFERENCES ideas(id),
      FOREIGN KEY (investor_id) REFERENCES users(id)
    )
  `);

  // MESSAGES
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `);

});

module.exports = db;