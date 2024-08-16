const SERVICE_NAME = "JobQueue";

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await req.jobQueue.getMetrics();
    res
      .status(200)
      .json({ success: true, msg: "Metrics retrieved", data: metrics });
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
    return;
  }
};

const getJobs = async (req, res, next) => {
  try {
    const jobs = await req.jobQueue.getJobStats();
    return res.status(200).json({ jobs });
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
    return;
  }
};

const addJob = async (req, res, next) => {
  try {
    await req.jobQueue.addJob(Math.random().toString(36).substring(7));
    return res.send("Added job");
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
    return;
  }
};

const obliterateQueue = async (req, res, next) => {
  try {
    const obliterated = await req.jobQueue.obliterate();
    return res.status(200).send("Obliterated jobs");
  } catch (error) {
    error.service = SERVICE_NAME;
    next(error);
    return;
  }
};

module.exports = {
  getMetrics,
  getJobs,
  addJob,
  obliterateQueue,
};
