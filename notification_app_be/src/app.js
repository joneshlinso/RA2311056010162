const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./routes/notificationRoutes');
const { Log } = require('../../logging_middleware/logger');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/v1/notifications', notificationRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
    console.log(`Notification Service running on port ${PORT}`);
    await Log("backend", "info", "config", `Notification service started on port ${PORT}`);
});
