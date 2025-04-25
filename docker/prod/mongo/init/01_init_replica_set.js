function waitForPrimary() {
  while (true) {
    try {
      rs.initiate({
        _id: "rs0",
        members: [{ _id: 0, host: "localhost:27017" }],
      });
      break;
    } catch (e) {
      print("Replica set initiation failed, retrying in 2s...");
      sleep(2000);
    }
  }
}

waitForPrimary();
