# Campus Notification System

This document explains the overall working and design of the campus notification platform.

## Stage 1 — API Design

The system contains APIs for fetching and managing notifications for students.

### Main APIs used:
- `GET /notifications` → fetch all notifications
- `GET /notifications/:id` → fetch single notification
- `PATCH /notifications/:id/read` → mark notification as read
- `PATCH /notifications/read-all` → mark all notifications as read
- `DELETE /notifications/:id` → delete notification

For live notification updates, **Server Sent Events (SSE)** is used because it is simple and enough for one-way communication from server to users.

## Stage 2 — Database Design

**PostgreSQL** database is used because it handles relational data properly and also supports indexing and scaling better.

### Main tables:
- `students`
- `notifications`

### Notification table stores:
- notification type
- message
- read status
- timestamp

### For handling larger data:
- indexing can be used
- partitioning can be added later
- JSONB is used for flexible metadata storage

## Stage 3 — Query Optimization

Unread notification queries become slower when notification count increases.

To improve performance, indexes are added on:
- `student_id`
- `is_read`
- `created_at`

This helps avoid full table scans and improves fetching speed.

## Stage 4 — Caching

**Redis** caching is used to reduce database load and improve response time.

### Cached items:
- unread notifications
- unread count

Cursor-based pagination is preferred because OFFSET-based pagination becomes slower for large data.

## Stage 5 — Bulk Notifications

Sending notifications one by one is not efficient for large number of students.

### Improved flow:
- notifications are stored in bulk
- queues are used for email processing
- worker services handle notification sending
- retries are added for failed deliveries

This improves scalability and reliability.

## Stage 6 — Priority Inbox

Notifications are sorted based on:
- notification priority
- latest timestamp

### Priority order:
**Placement** notifications have highest priority, then **Result**, then **Event** notifications.

**Min-Heap** approach can be used to efficiently maintain top notifications when new notifications are continuously added.
