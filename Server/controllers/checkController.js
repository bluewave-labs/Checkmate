const {
  createCheckParamValidation,
  createCheckBodyValidation,
  getChecksParamValidation,
  getChecksQueryValidation,
  getTeamChecksParamValidation,
  getTeamChecksQueryValidation,
  deleteChecksParamValidation,
} = require("../validation/joi");
const { successMessages } = require("../utils/messages");
const SERVICE_NAME = "check";

const createCheck = async (req, res, next) => {
  try {
    await createCheckParamValidation.validateAsync(req.params);
    await createCheckBodyValidation.validateAsync(req.body);
  } catch (error) {
    error.status = 422;
    error.service = SERVICE_NAME;
    error.message =
      error.details?.[0]?.message || error.message || "Validation Error";
    next(error);
    return;
  }

  try {
    const checkData = { ...req.body };
    const check = await req.db.createCheck(checkData);
    return res
      .status(200)
      .json({ success: true, msg: successMessages.CHECK_CREATE, data: check });
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
  }
};

const getChecks = async (req, res, next) => {
  try {
    await getChecksParamValidation.validateAsync(req.params);
    await getChecksQueryValidation.validateAsync(req.query);
  } catch (error) {
    error.status = 422;
    error.service = SERVICE_NAME;
    error.message =
      error.details?.[0]?.message || error.message || "Validation Error";
    next(error);
    return;
  }

  try {
    const checks = await req.db.getChecks(req);
    const checksCount = await req.db.getChecksCount(req);
    return res.status(200).json({
      success: true,
      msg: successMessages.CHECK_GET,
      data: { checksCount, checks },
    });
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
  }
};

const getTeamChecks = async (req, res, next) => {
  try {
    await getTeamChecksParamValidation.validateAsync(req.params);
    await getTeamChecksQueryValidation.validateAsync(req.query);
  } catch (error) {
    error.status = 422;
    error.service = SERVICE_NAME;
    error.message =
      error.details?.[0]?.message || error.message || "Validation Error";
    next(error);
    return;
  }
  try {
    const checkData = await req.db.getTeamChecks(req);
    return res.status(200).json({
      success: true,
      msg: successMessages.CHECK_GET,
      data: checkData,
    });
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
  }
};

const deleteChecks = async (req, res, next) => {
  try {
    await deleteChecksParamValidation.validateAsync(req.params);
  } catch (error) {
    error.status = 422;
    error.service = SERVICE_NAME;
    error.message =
      error.details?.[0]?.message || error.message || "Validation Error";
    next(error);
    return;
  }

  try {
    const deletedCount = await req.db.deleteChecks(req.params.monitorId);
    return res.status(200).json({
      success: true,
      msg: successMessages.CHECK_DELETE,
      data: { deletedCount },
    });
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
  }
};

module.exports = {
  createCheck,
  getChecks,
  getTeamChecks,
  deleteChecks,
};
