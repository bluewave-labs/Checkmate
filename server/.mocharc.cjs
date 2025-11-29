module.exports = {
	require: ["esm", "chai/register-expect.js"], // Include Chai's "expect" interface globally
	spec: "tests/**/*.test.js", // Specify test files
	timeout: 5000, // Set test-case timeout in milliseconds
	recursive: true, // Include subdirectories
	reporter: "spec", // Use the "spec" reporter
	exit: true, // Force Mocha to quit after tests complete
};
