const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

/**
 * Endpoint to analyze traffic data and suggest optimizations.
 * Mimics the Gemini AI analysis.
 * @route POST /api/analyze-traffic
 * @param {object} req.body - The traffic snapshot data.
 * @param {object[]} req.body.intersections - Array of intersection objects with queue data.
 * @param {object} req.body.stats - Overall traffic statistics.
 * @returns {object} A GeminiAnalysis-like object.
 */
app.post('/api/analyze-traffic', (req, res) => {
  const { intersections, stats } = req.body;

  if (!intersections || !stats) {
    return res.status(400).json({ error: 'Invalid traffic data payload.' });
  }

  // Find the most congested intersection from the detailed payload
  let mostCongested = null;
  let maxQueue = 0;

  intersections.forEach(i => {
    // The intersection payload in the request has a different shape
    const totalQueue = (i.queues.northSouth || 0) + (i.queues.eastWest || 0);
    if (totalQueue > maxQueue) {
      maxQueue = totalQueue;
      mostCongested = i;
    }
  });

  const response = {
    timestamp: Date.now(),
    analysis: "Grid flow is optimal. No adjustments required at this time.",
    suggestedChanges: [],
  };

  // If congestion is high and we found a congested junction, create a suggestion.
  if (stats.congestionLevel > 65 && mostCongested) {
    const newGreenDuration = Math.min(300, Math.round(150 + stats.congestionLevel * 1.5));
    
    response.analysis = `Critical congestion detected, primarily at ${mostCongested.name}. Signal phase optimization is recommended to clear the gridlock.`;
    response.suggestedChanges.push({
      intersectionId: mostCongested.id,
      newGreenDuration: newGreenDuration,
      reason: `Heavy queue (${maxQueue} units) detected. Extending green phase to improve flow.`,
    });
  }

  // Simulate a network delay
  setTimeout(() => {
    res.json(response);
  }, 1000 + Math.random() * 500);
});

/**
 * Endpoint to generate a natural-language route suggestion.
 * Mimics the Gemini AI pathfinding suggestion.
 * @route POST /api/path-suggestion
 * @param {string[]} req.body.path - An array of junction labels representing the route.
 * @returns {object} An object containing the suggestion string.
 */
app.post('/api/path-suggestion', (req, res) => {
  const { path } = req.body;

  if (!path || !Array.isArray(path) || path.length < 2) {
    return res.status(400).json({ error: 'Invalid path data. Requires an array of at least two junction labels.' });
  }

  const suggestion = `Optimal route confirmed. Proceed via ${path[1]} to bypass congestion near ${path[0]}.`;

  // Simulate a network delay
  setTimeout(() => {
    res.json({ suggestion });
  }, 500 + Math.random() * 300);
});

app.listen(port, () => {
  console.log(`BharatFlow AI Backend Mock running at http://localhost:${port}`);
  console.log('Endpoints:');
  console.log('  POST /api/analyze-traffic');
  console.log('  POST /api/path-suggestion');
});
