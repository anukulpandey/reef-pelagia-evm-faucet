const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Pool, Client } = require("pg");
require("dotenv").config();
const { ethers } = require("ethers");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PORT = process.env.PORT || 4000;

// Ethers setup
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const DB_NAME = "pelagia_faucet_db";
const DB_CONFIG = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  password: process.env.DB_PASSWORD || "your_password",
  port: process.env.DB_PORT || 5432,
};

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// --- Initialize DB ---
async function initDB() {
  try {
    const client = new Client({ ...DB_CONFIG, database: "postgres" });
    await client.connect();

    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database '${DB_NAME}' created.`);
    } else {
      console.log(`ℹ️ Database '${DB_NAME}' already exists.`);
    }
    await client.end();

    const pool = new Pool({ ...DB_CONFIG, database: DB_NAME });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        github_username TEXT NOT NULL,
        wallet_address TEXT NOT NULL UNIQUE,
        token_sent_at TIMESTAMP,
        nonce BIGINT DEFAULT 0
      );
    `);
    console.log("✅ Table 'requests' is ready.");

    return pool;
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
}

// --- GitHub OAuth ---
app.get("/auth/github", (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=read:user`;
  res.redirect(redirectUrl);
});

app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: REDIRECT_URI },
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

// --- Mutex map for nonce handling ---
const nonceLocks = new Map();

// --- Protected Faucet Route ---
let pool;
app.post("/tokens", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Not authorized");

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Not authorized");

  const { address } = req.body;
  if (!address) return res.status(400).send("No address provided");

  try {
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const githubUser = userResponse.data.login;

    // --- Acquire lock for this address ---
    while (nonceLocks.get(address)) {
      await new Promise((r) => setTimeout(r, 50)); // wait until lock is released
    }
    nonceLocks.set(address, true);

    // --- Fetch current nonce ---
    let { rows } = await pool.query(
      `SELECT nonce FROM requests WHERE wallet_address = $1`,
      [address]
    );

    let nonce = 0;
    if (rows.length > 0) {
      nonce = parseInt(rows[0].nonce, 10) + 1;
      await pool.query(
        `UPDATE requests SET nonce = $1, token_sent_at = NOW() WHERE wallet_address = $2`,
        [nonce, address]
      );
    } else {
      await pool.query(
        `INSERT INTO requests (github_username, wallet_address, token_sent_at, nonce)
         VALUES ($1, $2, NOW(), $3)`,
        [githubUser, address, nonce]
      );
    }

    // --- Release lock ---
    nonceLocks.delete(address);

    const tx = {
      to: address,
      value: ethers.parseEther("0.01"),
      // nonce,
    };

    const sentTx = await wallet.sendTransaction(tx);
    console.log(`✅ TX Hash: ${sentTx.hash}`);

    console.log(`💧 Tokens sent for ${githubUser} (${address}) with nonce ${nonce}`);

    res.json({
      message: "✅ Tokens sent",
      github_user: githubUser,
      address,
      nonce,
    });
  } catch (err) {
    nonceLocks.delete(address);
    console.error("❌ Token request failed:", err.message);
    res.status(401).send("Invalid GitHub token");
  }
});

// --- Start server ---
(async () => {
  pool = await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
