/**
 * Simple priority handler for Stage 6. 
 * I used a basic sorted array approach because it's easier to debug 
 * than a full binary heap for this specific use case.
 */
class MessageQueue {
    constructor() {
        this.list = [];
    }
    
    // Lower number = Higher priority (1 is top)
    addToQueue(data, priorityLevel) {
        this.list.push({ data, p: priorityLevel });
        // Keeping it sorted so the next() call is always O(1)
        this.list.sort((a, b) => a.p - b.p);
    }
    
    getNext() {
        return this.list.shift();
    }
    
    isEmpty() {
        return this.list.length === 0;
    }
}

const MSG_TEMPLATES = {
    "WELCOME_EMAIL": "Hey {{name}}, thanks for joining us! Your email is set as {{email}}.",
    "MAINTENANCE_ALERT": "Warning: Vehicle {{vehicle_id}} is due for service immediately."
};

const internalQueue = new MessageQueue();
const PRIORITY_LEVELS = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };

function fillTemplate(id, data) {
    let raw = MSG_TEMPLATES[id];
    if (!raw) throw new Error(`Template not found: ${id}`);
    
    // Manual replacement to avoid heavy regex
    Object.keys(data).forEach(key => {
        raw = raw.replace(`{{${key}}}`, data[key]);
    });
    return raw;
}

/**
 * Main dispatcher for Stage 6. 
 * It handles the priority mapping and simulates the delivery delay.
 */
async function dispatchNotification(targetUser, type, template, vars, level = 'LOW') {
    const body = fillTemplate(template, vars);
    
    // Queue it up based on priority
    const priorityScore = PRIORITY_LEVELS[level] || 3;
    internalQueue.addToQueue({ targetUser, type, body }, priorityScore);
    
    // Pick the top item (Stage 6 logic)
    const task = internalQueue.getNext();
    
    // Artificial wait to mimic API latency
    await new Promise(r => setTimeout(r, 600));

    return {
        delivery_id: `id_${Math.random().toString(16).slice(2, 10)}`,
        user: targetUser,
        urgency: level,
        status: "SENT",
        content: body,
        sent_at: new Date().toISOString()
    };
}

module.exports = { dispatchNotification };