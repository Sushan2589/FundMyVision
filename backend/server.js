const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require("./db");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
  })
);

// Example user
const users = [
  {
    username: 'admin',
    password: bcrypt.hashSync('1234', 10),
  },
];

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

function investorOnly(req, res, next) {
    if (req.session.user?.role === "investor") {
        return next();
    }
    res.status(403).send("Access denied");
}

function ideatorOnly(req, res, next) {
    if (req.session.user?.role === "ideator") {
        return next();
    }
    res.status(403).send("Access denied");
}

function adminOnly(req, res, next) {
    if (req.session.user?.role === "admin") {
        return next();
    }
    res.status(403).send("Access denied");
}

app.get("/signup", (req, res) => {
  res.send(`
    <form method="POST" action="/signup">
      <input name="username" placeholder="Username">
      <input name="password" type="password" placeholder="Password">

      <select name="role">
    <option value="ideator">Ideator</option>
    <option value="investor">Investor</option>
</select>

      <button>Sign Up</button>


    </form>
  `);
});

app.get('/login', (req, res) => {
    const message =
    req.query.signup === "success"
      ? "<p>Account created successfully. Please log in.</p>"
      : "";

  res.send(`
    <form method="POST" action="/login">
      <input name="username" placeholder="Username">
      <input name="password" type="password" placeholder="Password">
      <button>Login</button>

      <p>
      Don't have an account?
      <a href="/signup">Sign Up</a>
    </p>
    </form>
  `);
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(username, password, role) VALUES (?, ?)",
    [username, hash, role],
    function (err) {
      if (err) {
        return res.send("Username already exists");
      }

      
      res.redirect("/login?signup=success");
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
        return res.send("User not found");
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.send("Wrong password");
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      res.redirect("/dashboard");
    }
  );
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.send(`
    <h1>Welcome ${req.session.user.username}</h1>
    <a href="/logout">Logout</a>
  `);
});

app.get("/investor/dashboard", isAuthenticated, investorOnly, (req, res) => {
    res.send("Investor Dashboard");
});

app.get("/ideator/dashboard", isAuthenticated, ideatorOnly, (req, res) => {
    res.send("Ideator Dashboard");
});

app.get("/admin", isAuthenticated, adminOnly, (req, res) => {
    res.send("Admin Panel");
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});