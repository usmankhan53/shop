const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Dummy cart
const CART = [
  { name: "Phone", price: 500 },
  { name: "Headphones", price: 50 }
];

// Show cart
app.get("/", (req, res) => {
  const total = CART.reduce((sum, p) => sum + p.price, 0);
  res.render("cart", { cart: CART, total });
});

app.get("/checkout", async (req, res) => {
  const total = CART.reduce((sum, p) => sum + p.price, 0);

  const payload = {
    amount: String(total),
    currency: "USDT",
    order_id: "ORDER-001"
  };

  const payloadStr = JSON.stringify(payload);
  const sign = crypto
    .createHash("md5")
    .update(Buffer.from(payloadStr + process.env.CRYPTOMUS_API_KEY))
    .digest("hex");

  try {
    const response = await axios.post(
      "https://api.cryptomus.com/v1/payment",
      payload,
      {
        headers: {
          merchant: process.env.CRYPTOMUS_MERCHANT_ID,
          sign,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data;

    res.render("checkout", {
      payform: data.result?.url ? `<iframe src="${data.result.url}" width="600" height="400"></iframe>` : null,
      error: data.result?.url ? null : JSON.stringify(data)
    });

  } catch (err) {
    res.render("checkout", { payform: null, error: err.message });
  }
});


// Start server
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
