const SERVICE_NAME = "verifyTeamAccess";

const verifyTeamAccess = (Model, paramName) => {
	return async (req, res, next) => {
		try {
			const documentId = req.params[paramName];
			const doc = await Model.findById(documentId);
			if (req.user.teamId.toString() === doc.teamId.toString()) {
				next();
				return;
			}

			const error = new Error("Unauthorized");
			error.status = 403;
			throw error;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "verifyTeamAccess";
			next(error);
			return;
		}
	};
};

export { verifyTeamAccess };
