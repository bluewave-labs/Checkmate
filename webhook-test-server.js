const express = require("express");
const app = express();
const PORT = 4000; // You can use any available port

app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("--- Webhook Received ---");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("----------------------");

  res.status(200).send("Webhook received successfully!");
});

app.listen(PORT, () => {
  console.log(
    `Webhook test server running. Listening for POST requests at http://localhost:${PORT}/webhook`
  );
});
