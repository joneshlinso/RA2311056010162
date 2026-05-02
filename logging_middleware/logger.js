const API_URL = "http://20.207.122.201/evaluation-service/logs";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJqbDk3MDNAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMDM1OCwiaWF0IjoxNzc3Njk5NDU4LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYTFmMDIzNDgtZTk1MS00YjAwLTk5NjEtZGE3ZWI1ZWE2Njg4IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiam9uZXNoIGxpbnNvIiwic3ViIjoiMWE0NDE2N2UtZDkzZS00YTM0LWJlNWEtZGIyNjM2ZGIxMGEzIn0sImVtYWlsIjoiamw5NzAzQHNybWlzdC5lZHUuaW4iLCJuYW1lIjoiam9uZXNoIGxpbnNvIiwicm9sbE5vIjoicmEyMzExMDU2MDEwMTYyIiwiYWNjZXNzQ29kZSI6IlFrYnB4SCIsImNsaWVudElEIjoiMWE0NDE2N2UtZDkzZS00YTM0LWJlNWEtZGIyNjM2ZGIxMGEzIiwiY2xpZW50U2VjcmV0IjoiRndLWUNTWGJySHBOeEpQeSJ9.U5rDJIDYXc8LYw1cKsm05Kin07mNs_27zn7qn6zo3RU";

async function Log(stack, level, pkg, message) {
  const allowedStacks = ["backend"];
  const allowedLevels = ["debug", "info", "warn", "error", "fatal"];
  const allowedPackages = [
    "cache", "controller", "cron_job", "db", "domain", 
    "handler", "repository", "route", "service", 
    "auth", "config", "middleware", "utils"
  ];

  if (!allowedStacks.includes(stack) || 
      !allowedLevels.includes(level) || 
      !allowedPackages.includes(pkg)) {
    return;
  }

  const payload = {
    stack,
    level,
    package: pkg,
    message
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Fail silently to avoid breaking the app if logging fails
  }
}

/**
 * Express middleware for automatic request logging
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
        Log("backend", res.statusCode >= 400 ? "error" : "info", "middleware", message);
    });
    next();
}

module.exports = { Log, requestLogger };