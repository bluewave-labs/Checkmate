try {
  const status = rs.status();
  printjson(status);
} catch (e) {
  if (e.codeName === "NotYetInitialized") {
    print("Replica set not initialized. Initiating...");
    rs.initiate({
      _id: "rs0",
      members: [{ _id: 0, host: "mongodb:27017" }],
    });
  } else {
    print("Unexpected error during rs.status():");
    printjson(e);
  }
}
