import express from "express";
import Monitor from "../../db/v1/models/Monitor.js";

const router = express.Router();

router.get("/api/v1/summary", async (req, res) => {
  try {
    const uptime = await Monitor.countDocuments({ status: true, type: { $ne: "hardware" } });
    const infrastructure = await Monitor.countDocuments({ status: true, type: "hardware" });

    // TEMP : incident doesn't exist yet, we return 0
    const incidents = 0;

    res.json({ uptime, infrastructure, incidents });
  } catch (error) {
    console.error("Erreur /api/v1/summary :", error);
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;



