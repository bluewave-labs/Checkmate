import express from "express";
import Monitor from "../../db/v1/models/Monitor.js";
import Incident from "../../db/v1/models/Incident.js";

const router = express.Router();

router.get("/api/v1/summary", async (req, res) => {
  try {
    const [uptime, infrastructure, incidents] = await Promise.all([
     Monitor.countDocuments({ status: true, type: { $ne: "hardware" } }),
      Monitor.countDocuments({ status: true, type: "hardware" }),
      Incident.countDocuments({ status: true })
    ]);
    res.json({ uptime, infrastructure, incidents });
  } catch (error) {
    console.error("Erreur /api/v1/summary :", error);
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;