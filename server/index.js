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

    // Ensure database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_NAME]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database '${DB_NAME}' created.`);
    } else {
      console.log(`ℹ️ Database '${DB_NAME}' already exists.`);
    }
    await client.end();

    const pool = new Pool({ ...DB_CONFIG, database: DB_NAME });

    // Table for requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        github_username TEXT NOT NULL,
        wallet_address TEXT NOT NULL UNIQUE,
        token_sent_at TIMESTAMP
      );
    `);

    // Table for faucet wallet nonce
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faucet_nonce (
        id SERIAL PRIMARY KEY,
        last_nonce BIGINT DEFAULT 0
      );
    `);

    // Ensure at least one row exists in faucet_nonce
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

    // --- Acquire lock for the faucet wallet ---
    while (nonceLocks.get("FAUCET")) {
      await new Promise((r) => setTimeout(r, 50));
    }
    nonceLocks.set("FAUCET", true);

    let nonce;
    try {
      // Fetch last used nonce
      const { rows } = await pool.query(`SELECT last_nonce FROM faucet_nonce WHERE id = 1`);
      nonce = parseInt(rows[0].last_nonce, 10);

      // Increment nonce in DB
      await pool.query(`UPDATE faucet_nonce SET last_nonce = $1 WHERE id = 1`, [nonce + 1]);
    } finally {
      nonceLocks.delete("FAUCET");
    }

    // --- Insert request into requests table ---
    await pool.query(
      `INSERT INTO requests (github_username, wallet_address, token_sent_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (wallet_address) DO UPDATE SET token_sent_at = NOW()`,
      [githubUser, address]
    );

    const tx = {
      to: address,
      value: ethers.parseEther("0.01"),
      // nonce,
    };

    console.log("Sending transaction:", tx);
    const sentTx = await wallet.sendTransaction(tx);
    console.log(`✅ TX Hash: ${sentTx.hash}`);
    console.log(`💧 Tokens sent for ${githubUser} (${address}) with nonce ${nonce}`);
    res.json({
      message: "✅ Tokens sent",
      github_user: githubUser,
      address,
      nonce,
      txHash: sentTx.hash,
    });
  } catch (err) {
    nonceLocks.delete("FAUCET");
    console.error("❌ Token request failed:", err);
    res.status(500).send("Token request failed");
  }
});

// --- Test Transaction Route ---
app.post("/test-transaction", async (req, res) => {
  const { address, count } = req.body;

  if (!address || !count || count <= 0) {
    return res.status(400).json({ error: "Invalid address or count" });
  }

  try {
    console.log(`🚀 Initiating ${count} test transactions to ${address}`);

    // Lock nonce management
    while (nonceLocks.get("FAUCET")) {
      await new Promise((r) => setTimeout(r, 50));
    }
    nonceLocks.set("FAUCET", true);

    // Get last nonce from DB
    let { rows } = await pool.query(`SELECT last_nonce FROM faucet_nonce WHERE id = 1`);
    let currentNonce = parseInt(rows[0].last_nonce, 10);

    // Also get on-chain nonce to sync if necessary
    const onChainNonce = await provider.getTransactionCount(wallet.address, "pending");
    if (onChainNonce > currentNonce) {
      console.log(`🔄 Syncing local nonce (${currentNonce}) with chain nonce (${onChainNonce})`);
      currentNonce = onChainNonce;
      await pool.query(`UPDATE faucet_nonce SET last_nonce = $1 WHERE id = 1`, [currentNonce]);
    }

    // Reserve nonces for all upcoming txs in DB
    const nonces = Array.from({ length: count }, (_, i) => currentNonce + i);
    const nextNonce = currentNonce + count;
    await pool.query(`UPDATE faucet_nonce SET last_nonce = $1 WHERE id = 1`, [nextNonce]);
    nonceLocks.delete("FAUCET");

    // --- Create all transaction promises concurrently ---
    const txPromises = nonces.map(async (nonce, i) => {
      try {
        const tx = {
          to: address,
          value: ethers.parseEther("0.001"), // small test amount
          nonce,
        };

        const sentTx = await wallet.sendTransaction(tx);
        console.log(`✅ [${i + 1}/${count}] TX sent: ${sentTx.hash} (nonce: ${nonce})`);
        await sentTx.wait();
        return { success: true, nonce, hash: sentTx.hash };
      } catch (err) {
        console.error(`❌ TX ${i + 1} failed (nonce: ${nonce}):`, err.message);

        // If it's a nonce or replacement issue, retry with updated nonce
        if (err.message.includes("nonce") || err.message.includes("replacement")) {
          const chainNonce = await provider.getTransactionCount(wallet.address, "pending");
          console.log(`🔁 Retrying TX ${i + 1} with new nonce: ${chainNonce}`);

          const retryTx = {
            to: address,
            value: ethers.parseEther("0.001"),
            nonce: chainNonce,
          };

          try {
            const retried = await wallet.sendTransaction(retryTx);
            console.log(`✅ Retried TX hash: ${retried.hash}`);
            return { success: true, nonce: chainNonce, hash: retried.hash };
          } catch (retryErr) {
            console.error(`🚫 Retry failed: ${retryErr.message}`);
            return { success: false, nonce, error: retryErr.message };
          }
        }

        return { success: false, nonce, error: err.message };
      }
    });

    // Wait for all TXs to complete
    const results = await Promise.allSettled(txPromises);

    const summary = results.map((r) =>
      r.status === "fulfilled" ? r.value : { success: false, error: r.reason?.message || "unknown" }
    );

    const finalBalance = await provider.getBalance(wallet.address);
    console.log(`💰 Faucet balance after all TXs: ${ethers.formatEther(finalBalance)} ETH`);


    res.json({
      message: `Processed ${count} test transactions`,
      summary,
    });
  } catch (err) {
    nonceLocks.delete("FAUCET");
    console.error("❌ Test transaction error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


// --- Start server ---
(async () => {
  pool = await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
