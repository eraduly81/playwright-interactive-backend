import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { Logger } from '../config/Logger';
import { TestRunner } from '../engine/TestRunner';
import { TestSpec, TestResult } from '../specs/types';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.UI_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const logger = new Logger('Backend');
const testRunner = new TestRunner();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle favicon.ico requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.post('/api/tests/run', async (req, res) => {
  try {
    const testSpec: TestSpec = req.body;
    
    // Validate test spec
    if (!testSpec.name || !testSpec.endpoints) {
      return res.status(400).json({ error: 'Invalid test specification' });
    }

    logger.info(`Starting test execution: ${testSpec.name}`);
    
    // Notify clients that test is starting
    io.emit('testStarted', { testId: testSpec.id, name: testSpec.name });

    // Run the test
    const result = await testRunner.runTest(testSpec);
    
    // Notify clients of completion
    io.emit('testCompleted', { testId: testSpec.id, result });

    res.json(result);
    
  } catch (error) {
    logger.error('Test execution failed', error);
    res.status(500).json({ 
      error: 'Test execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    // TODO: Implement test result retrieval from database
    res.json({ message: 'Test result retrieval not implemented yet' });
  } catch (error) {
    logger.error('Failed to retrieve test result', error);
    res.status(500).json({ error: 'Failed to retrieve test result' });
  }
});

app.get('/api/tests', async (req, res) => {
  try {
    // TODO: Implement test list retrieval from database
    res.json({ message: 'Test list retrieval not implemented yet' });
  } catch (error) {
    logger.error('Failed to retrieve test list', error);
    res.status(500).json({ error: 'Failed to retrieve test list' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('subscribeToTest', (testId) => {
    socket.join(`test-${testId}`);
    logger.info(`Client ${socket.id} subscribed to test ${testId}`);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
