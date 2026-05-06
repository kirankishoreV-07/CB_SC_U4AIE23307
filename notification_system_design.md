# Campus Notifications — System Design Document

This document outlines the architecture and design of the Campus Notification Platform, covering API design, database strategy, performance optimization, and bulk processing.

---

## Stage 1 — REST API Design

The notification platform follows RESTful principles, providing endpoints for fetching, managing, and streaming notifications in real-time.

### Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/notifications` | Fetch paginated notifications for a student |
| `GET` | `/notifications/:id` | Fetch a single notification |
| `PATCH` | `/notifications/:id/read` | Mark one notification as read |
| `PATCH` | `/notifications/read-all` | Mark all as read for a student |
| `DELETE` | `/notifications/:id` | Delete a notification |
| `GET` | `/notifications/unread-count` | Fast count badge for the UI |

### Real-Time Mechanism: Server-Sent Events (SSE)

**Selection:** SSE was chosen over WebSockets for its simplicity and efficiency in one-way communication.
- **Efficiency:** SSE uses plain HTTP, avoiding the overhead of a WebSocket handshake and maintaining a lightweight persistent connection.
- **Reliability:** Built-in auto-reconnection and better compatibility with corporate proxies/firewalls.
- **Suitability:** Notifications are server-to-client pushes; bidirectional communication (WebSockets) is not required for this use case.

**Endpoint:** `GET /notifications/stream`
**Payload Example:**
```
event: notification
data: {"id":"uuid","type":"Placement","message":"CSX Corporation hiring","createdAt":"2026-05-06T10:00:00Z"}
```

---

## Stage 2 — Database Design

### Recommended Database: PostgreSQL

PostgreSQL is selected for its robust support for relational data, transaction integrity (ACID), and powerful indexing capabilities. It handles millions of notifications efficiently while providing flexibility for future scale.

### Schema Definition

```sql
CREATE TABLE students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  UNIQUE NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  message         TEXT          NOT NULL,
  is_read         BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  metadata        JSONB
);
```

### Scale Strategy
- **Partitioning:** Implement monthly range partitioning on `created_at` for the `notifications` table to maintain performance as data grows to tens of millions of rows.
- **JSONB:** Used for `metadata` to store type-specific data without frequent schema migrations.

---

## Stage 3 — Query Optimisation

### The Slow Query Problem
A common bottleneck is fetching unread notifications for a specific student:
```sql
SELECT * FROM notifications 
WHERE student_id = 'uuid-123' AND is_read = false 
ORDER BY created_at DESC;
```
Without proper indexing, this results in a Sequential Scan (O(n)), which slows down significantly as the table grows.

### The Fix: Composite Indexing
To optimize this, we implement a composite index:
```sql
CREATE INDEX idx_notif_student_unread 
ON notifications (student_id, is_read, created_at DESC);
```
**Impact:** Reduces query time from O(n) to O(log n + k), where k is the number of results. The index matches the filter and sort criteria perfectly, allowing PostgreSQL to perform a fast Index Scan.

---

## Stage 4 — Caching & Performance

To handle high traffic (50,000+ active students), a multi-layered caching strategy is implemented using **Redis**.

### 1. Unread List Caching
- **Key:** `notif:unread:{studentId}`
- **Value:** JSON array of top N unread notifications.
- **TTL:** 30 seconds.
- **Invalidation:** Cache is deleted whenever a new notification is added or an existing one is marked as read.

### 2. Unread Count Caching
Dedicated cache for the "badge count" to avoid frequent `COUNT(*)` queries on the primary DB.

### 3. Cursor-Based Pagination
Instead of `OFFSET` (which still scans skipped rows), use cursor pagination:
```sql
SELECT * FROM notifications 
WHERE student_id = $1 AND is_read = false AND created_at < $cursor 
ORDER BY created_at DESC LIMIT 20;
```

---

## Stage 5 — Bulk Notification Redesign

### Problem with Naive Implementation
- **Synchronous blocking:** Processing 50,000 students in a single loop blocks the main thread.
- **Fragility:** One failure (e.g., Email API timeout) can crash the entire process.
- **No Retries:** Transient failures result in lost notifications.

### High-Scale Architecture
1. **Batch Insert:** Perform a single bulk `INSERT` into the DB (atomic and fast).
2. **Message Queue (Redis/RabbitMQ):** Enqueue separate jobs for delivery (Email, Push, SMS).
3. **Worker Pool:** Dedicated workers consume jobs from the queue.
4. **Resilience:** Built-in retries with exponential backoff and a Dead Letter Queue (DLQ) for final failures.

**Separation of Concerns:** DB persistence and external delivery must be decoupled. DB is the source of truth; delivery is a side-effect that can fail and be retried independently.

---

## Stage 6 — Priority Inbox (Working Code)

The Priority Inbox is the final user-facing component that surfaces the most critical information by applying weighted sorting to live incoming data.

### Weighted Priority Algorithm
Each notification type is assigned a weight:
- **Placement:** 3 (Highest Priority)
- **Result:** 2
- **Event:** 1

**Sorting Logic:**
1. Sort by `Weight` descending.
2. For items with the same weight, sort by `Timestamp` descending (most recent first).

### Performance for Live Data
To maintain the Top N notifications in real-time without O(k log k) sorting overhead, a **Min-Heap of size N** is used. This reduces the insertion cost to O(log N) per new notification, ensuring the interface remains responsive even during high-volume periods (e.g., during placement season or result releases).

