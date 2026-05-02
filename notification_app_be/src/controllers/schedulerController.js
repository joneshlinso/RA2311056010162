const { scheduleMaintenance } = require('../services/scheduler');
const { Log } = require('../../../logging_middleware/logger');

async function handleScheduleRequest(req, res) {
    try {
        const { vehicles } = req.body;

        await Log("backend", "info", "controller", `Received scheduling request for ${vehicles?.length || 0} vehicles`);

        if (!vehicles) {
            await Log("backend", "warn", "controller", "Missing vehicles array in request body");
            return res.status(400).json({ error: "Missing 'vehicles' in request body" });
        }

        const scheduledList = scheduleMaintenance(vehicles);

        await Log("backend", "info", "controller", "Successfully calculated maintenance schedule");
        
        return res.status(200).json({
            message: "Scheduling successful",
            data: scheduledList
        });

    } catch (error) {
        await Log("backend", "error", "controller", `Scheduling failed: ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = { handleScheduleRequest };
