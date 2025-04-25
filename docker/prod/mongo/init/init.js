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

// Switch to uptime_db
db = db.getSiblingDB("uptime_db");

// Create app user
var username = _getEnv("USERNAME_ENV_VAR");
var password = _getEnv("PASSWORD_ENV_VAR");

db.createUser({
  user: username,
  pwd: password,
  roles: [{ role: "readWrite", db: "uptime_db" }],
});

print("User '" + username + "' created successfully");
