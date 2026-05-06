# Backend Evaluation System

This project contains a backend system built for the evaluation tasks. It includes a logging utility, a vehicle maintenance scheduler, and a notification backend service.

## Project Structure

- `logging_middleware/`  
  Reusable logging utility used across the project.

- `vehicle_maintence_scheduler/`  
  Service for scheduling maintenance tasks based on available mechanic hours.

- `notification_app_be/`  
  Backend service for handling and prioritizing notifications.

- `notification_system_design.md`  
  Contains system design notes and architecture details.

---

## Features

### Vehicle Maintenance Scheduler
- Fetches depot and task data from the API.
- Selects maintenance tasks within given hour limits.
- Uses a simple optimization approach for task selection.

### Notification Backend
- Sorts notifications based on priority and time.
- Supports filtering and pagination.
- Designed to handle large notification data efficiently.

### Logging Middleware
- Centralized logging utility.
- Used for API requests, errors, and important events.
- Helps in debugging and monitoring.

---

## Setup

### Install Dependencies
```bash
npm install
```

### Running the Services

**Vehicle Maintenance Scheduler:**
```bash
node vehicle_maintence_scheduler/index.js
```

**Notification Backend:**
```bash
node notification_app_be/index.js
```
