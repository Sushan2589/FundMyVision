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

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.get("/signup", (req, res) => {
  res.send(`
    <form method="POST" action="/signup">
      <input name="email" type="email" placeholder="Email">
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
  const { email, username, password, role } = req.body;
  console.log(req.body)
  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(email, username, password, role) VALUES (?, ?, ?, ?)",
    [email, username, hash, role],
    function (err) {
      if (err) {
       console.log(err);
    return res.send(err.message);
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
        role: user.role,
        email: user.email
      };

      if (user.role === "ideator") {
  return res.redirect("/ideator/dashboard");
}

if (user.role === "investor") {
  return res.redirect("/investor/dashboard");
}

if (user.role === "admin") {
  return res.redirect("/admin/dashboard");
}

res.redirect("/login");
    }
  );
});



app.get("/admin", isAuthenticated, adminOnly, (req, res) => {
    res.send("Admin Panel");
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.use("/ideator", ideatorRoutes);
app.use("/investor", investorRoutes);
app.use("/api/ideas", ideasRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/interests", interestsRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});