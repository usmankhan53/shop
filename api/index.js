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


// ✅ Helper: generate sign as per docs
function makeSign(payload, apiKey) {
  const data = JSON.stringify(payload);
  const base64 = Buffer.from(data).toString("base64");
  return crypto.createHash("md5").update(base64 + apiKey).digest("hex");
}

// Checkout route
app.post("/api/checkout", async (req, res) => {
  try {
    const { amount, currency = "USDT", order_id } = req.body;

    if (!amount || !order_id) {
      return res
        .status(400)
        .json({ error: "amount and order_id are required" });
    }

    // Build payload
    const payload = {
      amount: String(amount),
      currency,
      order_id,
      // optionally you can add url_callback, lifetime, etc.
    };

    // ✅ Correct signature
    const sign = makeSign(payload, process.env.CRYPTOMUS_API_KEY);

    // ✅ Correct request with merchant header
    const response = await axios.post(
      "https://api.cryptomus.com/v1/payment",
      payload,
      {
        headers: {
          merchant: process.env.CRYPTOMUS_MERCHANT_ID, // <- your merchant UUID from dashboard
          sign,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ If Cryptomus returns payform HTML, return it
    if (response.data.payform) {
      res.send(response.data.payform);
    } else {
      res.json(response.data);
    }
  } catch (err) {
    console.error("Checkout error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Vercel expects a function export
module.exports = app;
