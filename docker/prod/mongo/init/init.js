function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initReplicaSet() {
  while (true) {
    try {
      rs.initiate({
        _id: "rs0",
        members: [{ _id: 0, host: "localhost:27017" }],
      });
      print("Replica set initiated.");
      break;
    } catch (e) {
      print("Replica set initiation failed, retrying in 2s...");
      await sleep(2000);
    }
  }

  // Wait until the node becomes primary
  while (true) {
    try {
      const status = rs.status();
      if (status.myState === 1) {
        print("Node is now PRIMARY.");
        break;
      }
    } catch (e) {
      print("⏳ Waiting for PRIMARY state...");
    }
    await sleep(1000);
  }
}

async function createAppUser() {
  const username = process.env.USERNAME_ENV_VAR;
  const password = process.env.PASSWORD_ENV_VAR;

  if (!username || !password) {
    throw new Error("USERNAME_ENV_VAR or PASSWORD_ENV_VAR not set.");
  }

  const dbName = "uptime_db";
  const userDb = db.getSiblingDB(dbName);

  try {
    userDb.createUser({
      user: username,
      pwd: password,
      roles: [{ role: "readWrite", db: dbName }],
    });
    print(`✅ User '${username}' created successfully.`);
  } catch (e) {
    print(`⚠️ Failed to create user '${username}': ${e.message}`);
  }
}

await initReplicaSet();
await createAppUser();
