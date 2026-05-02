// Pure JavaScript Template Processing
const TEMPLATES = {
    "WELCOME_EMAIL": "Hello {{name}}, welcome to Affordmed! Your registered email is {{email}}.",
    "MAINTENANCE_ALERT": "URGENT: Vehicle {{vehicle_id}} requires immediate maintenance."
};

/**
 * Replaces {{variables}} in a string with actual data without external libraries.
 */
function processTemplate(templateId, payloadData) {
    let templateStr = TEMPLATES[templateId];
    
    if (!templateStr) {
        throw new Error(`Template ID '${templateId}' not found.`);
    }

    for (const key in payloadData) {
        const placeholder = `{{${key}}}`;
        templateStr = templateStr.split(placeholder).join(payloadData[key]);
    }

    return templateStr;
}

/**
 * Simulates sending a notification
 */
async function dispatchNotification(userId, channel, templateId, payloadData) {
    const finalMessage = processTemplate(templateId, payloadData);

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        delivery_id: `msg_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        channel: channel,
        status: "DELIVERED",
        message_body: finalMessage,
        timestamp: new Date().toISOString()
    };
}

module.exports = { dispatchNotification };