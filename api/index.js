const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend is live ! Use POST /api/checkout to create a payment."
  });
});

// Checkout route
app.post("/api/checkout", async (req, res) => {
  try {
    const { amount, currency = "USDT", order_id } = req.body;

    if (!amount || !order_id) {
      return res.status(400).json({ error: "amount and order_id are required" });
    }

    const payload = { amount: String(amount), currency, order_id };
    const payloadStr = JSON.stringify(payload);

    const sign = crypto
      .createHash("md5")
      .update(Buffer.from(payloadStr + process.env.CRYPTOMUS_API_KEY))
      .digest("hex");

    const response = await axios.post(
      "https://api.cryptomus.com/v1/payform",
      payload,
      {
        headers: {
          merchant: process.env.CRYPTOMUS_MERCHANT_ID,
          sign,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Vercel expects a function export
module.exports = app;
