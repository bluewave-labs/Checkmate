var username = process.env.USERNAME_ENV_VAR;
var password = process.env.PASSWORD_ENV_VAR;

db = db.getSiblingDB("uptime_db");

db.createUser({
	user: username,
	pwd: password,
	roles: [
		{
			role: "readWrite",
			db: "uptime_db",
		},
	],
});
print("User uptime_user created successfully");
