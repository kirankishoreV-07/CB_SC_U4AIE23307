# Backend Evaluation System

A comprehensive backend system consisting of a vehicle maintenance scheduling microservice and a prioritized campus notification system.

## Project Structure

- `logging_middleware/`: Standardized logging utility used across the system.
- `vehicle_maintence_scheduler/`: Optimization service for scheduling vehicle maintenance tasks using the 0/1 Knapsack algorithm.
- `notification_app_be/`: Backend service for a prioritized notification system that sorts messages based on category weight and recency.
- `notification_system_design.md`: Technical documentation and architectural design for the notification platform.

## Features

### 1. Vehicle Maintenance Scheduler
- Fetches live depot and task data from the evaluation server.
- Implements an optimized 0/1 Knapsack algorithm to maximize maintenance impact within mechanic hour constraints.
- Provides full traceback of selected tasks per depot.

### 2. Priority Notification System
- Dynamic sorting algorithm that prioritizes notifications by type (High, Medium, Low weights) and timestamp.
- Scalable design document covering database optimization, caching, and bulk processing.

### 3. Logging Utility
- Mandatory middleware for all logic paths.
- Provides structured JSON logs for observability, including status codes, request durations, and unique request IDs.

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Installation
```bash
npm install
```

### Running the Services

**Vehicle Maintenance Scheduler:**
```bash
node vehicle_maintence_scheduler/index.js
```

**Priority Inbox:**
```bash
node notification_app_be/index.js
```
