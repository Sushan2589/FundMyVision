const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require("./db");
const ideatorRoutes = require("./routes/ideator");
const isAuthenticated = require("./middleware/auth");
const ideatorOnly = require("./middleware/ideatorOnly");  
const investorOnly = require("./middleware/investorOnly");
const adminOnly = require("./middleware/adminOnly")

const sessiondataRoutes = require("./routes/api/sessionData");
const ideasRoutes = require("./routes/api/ideas");
const profileRoutes = require("./routes/api/profile");
const interestsRoutes = require("./routes/api/interests");
const investorRoutes = require("./routes/investor");
const kycRoutes = require("./routes/api/kyc");
const investorProfileRoutes = require("./routes/api/investorProfile");
const adminRoutes = require("./routes/api/admin");
const chatRoutes = require("./routes/api/chat");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use("/api/sessionData", sessiondataRoutes);

// Example user
const users = [
  {
    username: 'admin',
    password: bcrypt.hashSync('1234', 10),
  },
];

app.post("/signup", async (req, res) => {
  const { email, username, password, role } = req.body;
  console.log(req.body);
  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(email, username, password, role) VALUES (?, ?, ?, ?)",
    [email, username, hash, role],
    function (err) {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
      }

      res.json({ success: true });
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ error: "Wrong password" });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        }
      });
    }
  );
});

app.get("/admin", isAuthenticated, adminOnly, (req, res) => {
    res.send("Admin Panel");
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.use("/ideator", ideatorRoutes);
app.use("/investor", investorRoutes);
app.use("/api/ideas", ideasRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/interests", interestsRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/investor-profile", investorProfileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

// Recommender proxy endpoint
app.get("/api/recommend/:id", isAuthenticated, async (req, res) => {
  try {
    const response = await fetch(`http://localhost:8000/recommend/${req.params.id}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Recommender service error" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Recommender proxy error:", err.message);
    res.status(500).json({ error: "Could not connect to recommender service" });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});