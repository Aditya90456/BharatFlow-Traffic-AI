# BharatFlow AI - Mock Backend Server

This directory contains a simple Node.js Express server that simulates the AI/ML backend functionalities for the BharatFlow application. It's designed for demonstration and local development purposes, allowing the frontend to be tested without relying on live API calls to a generative model.

## Features

-   **Traffic Analysis Mock**: An endpoint that receives a snapshot of the traffic grid and returns a simulated AI analysis with suggested signal optimizations.
-   **Pathfinding Suggestion Mock**: An endpoint that takes a calculated route and returns a professional, natural-language dispatch instruction.
-   **Simulated Latency**: Endpoints include a random delay to mimic real-world network conditions.

## Endpoints

### 1. Analyze Traffic

-   **URL**: `/api/analyze-traffic`
-   **Method**: `POST`
-   **Body**:
    ```json
    {
      "intersections": [
        {
          "name": "Silk Board",
          "id": "INT-0-0",
          "queues": { "northSouth": 25, "eastWest": 10 }
        }
      ],
      "stats": {
        "congestionLevel": 75
      }
    }
    ```
-   **Success Response (200 OK)**:
    ```json
    {
      "timestamp": 1678886400000,
      "analysis": "Critical congestion detected, primarily at Silk Board...",
      "suggestedChanges": [
        {
          "intersectionId": "INT-0-0",
          "newGreenDuration": 262,
          "reason": "Heavy queue (35 units) detected. Extending green phase..."
        }
      ]
    }
    ```

### 2. Get Pathfinding Suggestion

-   **URL**: `/api/path-suggestion`
-   **Method**: `POST`
-   **Body**:
    ```json
    {
      "path": ["Dadar TT", "Sion Circle", "JVLR Junction"]
    }
    ```
-   **Success Response (200 OK)**:
    ```json
    {
      "suggestion": "Optimal route confirmed. Proceed via Sion Circle to bypass congestion near Dadar TT."
    }
    ```

## How to Run

1.  **Install Dependencies**: Make sure you have `express`, `cors`, and `body-parser` installed. You can add them to your project's `package.json`:
    ```bash
    npm install express cors body-parser
    ```

2.  **Start the Server**: From the project root, run the following command:
    ```bash
    node backend/server.js
    ```

The server will start on `http://localhost:3001`.
