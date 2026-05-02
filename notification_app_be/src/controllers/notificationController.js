const { dispatchNotification } = require('../services/notificationService');
const { Log } = require('../../../logging_middleware/logger');

async function handleSendNotification(req, res) {
    try {
        const { user_id, template_id, channel, payload_data, priority } = req.body;

        await Log("backend", "info", "controller", `Received ${channel} notification request for user ${user_id} (Priority: ${priority || 'LOW'})`);

        if (!user_id || !template_id || !channel) {
            await Log("backend", "warn", "controller", "Missing required fields in notification payload");
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await dispatchNotification(user_id, channel, template_id, payload_data, priority);

        await Log("backend", "info", "service", `Notification ${result.delivery_id} sent to ${user_id}`);

        return res.status(200).json({
            message: "Notification processed",
            details: result
        });

    } catch (error) {
        await Log("backend", "error", "controller", `Notification failed: ${error.message}`);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

module.exports = { handleSendNotification };