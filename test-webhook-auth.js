const http = require("http");
const url = require("url");

// Simple HTTP server to test webhook authentication
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  console.log("=== Webhook Request Received ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    console.log("Body:", body);
    console.log("=== End Request ===\n");

    // Check authentication
    const authHeader = req.headers.authorization;
    if (authHeader) {
      console.log("✅ Authentication header found:", authHeader);

      if (authHeader.startsWith("Basic ")) {
        const credentials = Buffer.from(
          authHeader.substring(6),
          "base64"
        ).toString();
        console.log("✅ Basic Auth credentials:", credentials);
      } else if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        console.log("✅ Bearer token:", token);
      }
    } else {
      console.log("❌ No authentication header found");
    }

    // Send response
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: "Webhook received",
        auth: authHeader ? "present" : "missing",
      })
    );
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Test webhook server running on http://localhost:${PORT}`);
  console.log(
    `📝 Use this URL in your webhook configuration: http://localhost:${PORT}/webhook`
  );
  console.log(
    "📊 This server will log all incoming requests and show authentication details\n"
  );
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down test server...");
  server.close(() => {
    console.log("✅ Test server closed");
    process.exit(0);
  });
});
