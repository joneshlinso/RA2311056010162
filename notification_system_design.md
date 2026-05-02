# Notification Service: Architecture & Scaling Report

## Core Design Decisions
For this project, I went with an event-driven setup. The goal was to make sure that if the Email provider goes down, we don't lose the notification or block the main API. By using a queue, we can just say "Okay, we got it" to the user and then handle the actual sending in the background.

## Database & Data Model
### Why PostgreSQL?
I chose Postgres mainly because I wanted relational safety for the `user_id` and `notification_logs`. Also, we might need to store complex payload data, so the `JSONB` column type is super handy here.

**Key Tables:**
*   `users`: Stores contact info and a JSON blob for preferences (opt-ins).
*   `notification_templates`: Keeps the message bodies separate so we can edit them without touching the code.
*   `delivery_history`: This is crucial for debugging. It tracks if a message is still pending, sent, or if it hit an error.

## Optimization & Indexing
One thing I realized is that as the `delivery_history` table grows to millions of rows, searching for a specific user's pending notifications will crawl. I added a composite index on `(user_id, status)`. 
*Self-correction:* I didn't index every column because that would just bloat the database and slow down every single "Send" request.

## Handling the "Traffic Spikes"
To prevent the database from choking when we send out a massive batch of notifications:
1.  **Pooling**: I used a connection pool so we're not opening and closing sockets constantly.
2.  **Pagination**: When showing history in a dashboard, I implemented limit/offset (though cursor-based would be better for very deep scrolling).
3.  **Lazy Loading**: We only fetch the template body right when we're about to send the message.

## Moving to Async (Queues)
The original idea was to just send the email right in the request handler, but that's a bad move for UX. I proposed a worker-based system.
*   **The flow**: Request -> Push to Redis/RabbitMQ -> Respond 202.
*   **The worker**: It picks up the task, tries to send it, and if it fails (like a 429 rate limit), it retries using **Exponential Backoff**.

## Priority Handling (Stage 6)
For the actual delivery logic, I used a Priority Queue. This ensures that an "Emergency Alert" doesn't get stuck behind a "Weekly Newsletter". I implemented this using a simple array-based heap logic, but for a smaller scale, even a sorted list works fine.

**How it works in my code:**
I mapped priorities to numeric values (High=1, Low=3). The dispatcher always pulls the message with the lowest numeric value first. This keeps the latency low for critical updates.
