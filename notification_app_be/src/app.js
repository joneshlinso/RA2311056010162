const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./routes/notificationRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const { Log, requestLogger } = require('../../logging_middleware/logger');

const app = express();
app.use(express.json());
app.use(cors());
app.use(requestLogger);

app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/scheduler', schedulerRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
    await Log("backend", "info", "config", `Notification service started on port ${PORT}`);
});
