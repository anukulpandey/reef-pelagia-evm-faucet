const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PORT = process.env.PORT || 4000;

// Step 1: GitHub OAuth redirect
app.get("/auth/github", (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read:user`;
  res.redirect(redirectUrl);
});

// Step 2: GitHub OAuth callback
app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    res.redirect(`${FRONTEND_URL}?token=${accessToken}&user=${githubUser.login}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth failed");
  }
});

// Step 3: Protected /tokens route
app.post("/tokens", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Not authorized");

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Not authorized");

  const { address } = req.body;
  if (!address) return res.status(400).send("No address provided");

  // Optional: verify token with GitHub
  try {
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const githubUser = userResponse.data;
    console.log(`Tokens requested by GitHub user: ${githubUser.login}, address: ${address}`);

    res.json({ message: "Tokens sent" });
  } catch (err) {
    console.error(err);
    res.status(401).send("Invalid GitHub token");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
