const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Pool, Client } = require("pg");
require("dotenv").config();
const { ethers } = require("ethers");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ======================
// ⚙️ CONFIG
// ======================
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PORT = process.env.PORT || 4000;

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

// ======================
// 🗄️ Initialize Database
// ======================
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
        token_sent_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS faucet_nonce (
        id SERIAL PRIMARY KEY,
        last_nonce BIGINT DEFAULT 0
      );
    `);

    const nonceRow = await pool.query(`SELECT * FROM faucet_nonce WHERE id = 1`);
    if (nonceRow.rows.length === 0) {
      await pool.query(`INSERT INTO faucet_nonce (last_nonce) VALUES (0)`);
    }

    console.log("✅ Tables are ready.");
    return pool;
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
}

// ======================
// 🔐 GitHub OAuth
// ======================
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
    console.error("❌ OAuth failed:", err.message);
    res.status(500).send("OAuth failed");
  }
});

// ======================
// 🧠 Global TX Queue System
// ======================
const txQueue = [];
let processingTx = false;

async function enqueueTransaction(taskFn) {
  txQueue.push(taskFn);
  processQueue();
}

async function processQueue() {
  if (processingTx) return;
  processingTx = true;

  while (txQueue.length > 0) {
    const nextTx = txQueue.shift();
    try {
      await nextTx();
    } catch (err) {
      console.error("❌ Transaction in queue failed:", err.message);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  processingTx = false;
}
// ======================
// 🚰 Protected Faucet Route
// ======================
let pool;
app.post("/tokens", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Not authorized");

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Not authorized");

  const { address } = req.body;
  if (!address) return res.status(400).send("No address provided");

  try {
    // Get GitHub user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const githubUser = userResponse.data.login;

    // Check last request time
    const lastRequestRes = await pool.query(
      `SELECT token_sent_at FROM requests WHERE wallet_address = $1`,
      [address]
    );

    const now = new Date();

    console.log("lastRequest at ",lastRequestRes);
    
    if (lastRequestRes.rows.length > 0) {
      const lastSent = lastRequestRes.rows[0].token_sent_at;
      const hoursDiff = (now - new Date(lastSent)) / 1000 / 60 / 60;
      if (hoursDiff < 24) {
        return res
          .status(429)
          .json({ message: "⏳ Tokens were already requested in the last 24 hours." });
      }
    }

    // Queue transaction safely
    await enqueueTransaction(async () => {
      console.log(`🚀 Processing TX for ${githubUser} (${address})`);

      const tx = {
        to: address,
        value: ethers.parseEther("0.01"),
      };

      const sentTx = await wallet.sendTransaction(tx);
      console.log(`✅ TX Hash: ${sentTx.hash}`);
      await sentTx.wait();
      console.log(`💧 Tokens delivered to ${address}`);

      // Update DB timestamp AFTER successful transaction
      await pool.query(
        `INSERT INTO requests (github_username, wallet_address, token_sent_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (wallet_address) DO UPDATE SET token_sent_at = NOW()`,
        [githubUser, address]
      );
    });

    res.json({ message: "⏳ Your transaction is queued and will be processed soon." });
  } catch (err) {
    console.error("❌ Token request failed:", err.message);
    res.status(500).send("Token request failed");
  }
});

// ======================
// 🧪 Test Transaction Route (like /tokens)
// ======================
app.post("/test-transaction", async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).send("No address provided");
  }

  console.log(`🚀 Received request to send test tokens to ${address}`);

  try {
    // Queue the transaction
    await enqueueTransaction(async () => {
      console.log(`🚀 Processing test TX to ${address}`);

      const tx = {
        to: address,
        value: ethers.parseEther("0.001"), // test token amount
      };

      const sentTx = await wallet.sendTransaction(tx);
      console.log(`✅ TX Hash: ${sentTx.hash}`);
      await sentTx.wait();
      console.log(`💧 Test tokens delivered to ${address}`);
    });

    res.json({ message: "⏳ Your test transaction is queued and will be processed soon." });
  } catch (err) {
    console.error("❌ Test transaction failed:", err.message);
    res.status(500).send("Test transaction failed");
  }
});

// ======================
// 🚀 Start Server
// ======================
(async () => {
  pool = await initDB();
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();
