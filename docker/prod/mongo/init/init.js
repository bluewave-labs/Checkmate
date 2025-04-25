function initiateReplicaSet() {
  try {
    rs.initiate({
      _id: "rs0",
      members: [{ _id: 0, host: "localhost:27017" }],
    });
  } catch (e) {
    print("Replica set already initiated or error occurred: " + e);
  }
}

function waitForPrimary() {
  while (true) {
    const isMaster = db.isMaster();
    if (isMaster.ismaster) {
      print("This node is now PRIMARY.");
      break;
    }
    print("Waiting to become PRIMARY...");
    sleep(2000);
  }
}

function createUser() {
  db = db.getSiblingDB("uptime_db");

  var username = process.env.USERNAME_ENV_VAR;
  var password = process.env.PASSWORD_ENV_VAR;

  db.createUser({
    user: username,
    pwd: password,
    roles: [{ role: "readWrite", db: "uptime_db" }],
  });

  print("User '" + username + "' created successfully");
}

initiateReplicaSet();
waitForPrimary();
createUser();
