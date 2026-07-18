const _fs = require('fs');
const { execSync } = require('child_process');

if (process.env.RENDER === 'true' || !_fs.existsSync(__dirname + '/.setup_done')) {
  try {
    console.log("\n=============================================");
    console.log("          CONFIGURING DATABASE TABLES        ");
    console.log("=============================================\n");
    execSync('node node_modules/prisma/build/index.js db push --accept-data-loss', { stdio: 'inherit', cwd: __dirname, shell: true });
    _fs.writeFileSync(__dirname + '/.setup_done', 'true');
    console.log("\n=============================================");
    console.log("        DATABASE SUCCESSFULLY CONFIGURED!    ");
    console.log("=============================================\n");
  } catch(e) {
    console.error("Auto-fix error during start-time DB configuration:", e.message);
  }
}

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Setup uploads folder & static route
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/predict';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-viva-key';

// Helper function to determine priority
function determinePriority(title, description) {
  const textContent = (title + " " + description).toLowerCase();
  const highPriorityKeywords = ['urgent', 'immediately', 'critical', 'emergency', 'asap', 'no food', 'starving', 'water leaking heavily', 'short circuit', 'fire'];
  const mediumPriorityKeywords = ['soon', 'important', 'food', 'dirty', 'broken'];

  if (highPriorityKeywords.some(keyword => textContent.includes(keyword))) {
    return 'High';
  } else if (mediumPriorityKeywords.some(keyword => textContent.includes(keyword))) {
    return 'Medium';
  }
  return 'Low';
}

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// --- DATABASE INITIALIZATION ROUTE (ON-DEMAND RUNTIME RUN) ---
app.get('/api/setup-db', async (req, res) => {
  try {
    const { exec } = require('child_process');
    console.log("On-demand DB setup triggered");
    
    // Push the schema
    exec('node node_modules/prisma/build/index.js db push --accept-data-loss', { cwd: __dirname }, (pushErr, pushStdout, pushStderr) => {
      if (pushErr) {
        console.error("On-demand db push failed:", pushErr.message);
        return res.status(500).json({ error: "Database push failed: " + pushErr.message, stderr: pushStderr });
      }
      
      console.log("On-demand DB setup succeeded");
      res.json({
        message: "Database successfully configured at runtime!",
        dbPushOutput: pushStdout
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can register students' });
    const { email, password, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, role }
    });
    
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ISSUES ROUTES ---

app.post('/api/issues', upload.single('evidence'), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude } = req.body;
    const evidencePath = req.file ? `/uploads/${req.file.filename}` : null;
    const priority = determinePriority(title, description);

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category,
        priority,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        evidence: evidencePath
      }
    });

    io.emit('issue-created', issue);
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/issues', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/issues/:id', authMiddleware, async (req, res) => {
  try {
    const { status, priority, category } = req.body;
    const updatedIssue = await prisma.issue.update({
      where: { id: req.params.id },
      data: { status, priority, category }
    });

    io.emit('issue-updated', updatedIssue);
    res.json(updatedIssue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/issues/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.issue.delete({ where: { id: req.params.id } });
    io.emit('issue-deleted', { id: req.params.id });
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ANALYTICS ROUTES ---

app.get('/api/analytics', async (req, res) => {
  try {
    const totalIssues = await prisma.issue.count();
    const openIssues = await prisma.issue.count({ where: { status: 'Open' } });
    const inProgressIssues = await prisma.issue.count({ where: { status: 'In Progress' } });
    const resolvedIssues = await prisma.issue.count({ where: { status: 'Resolved' } });

    res.json({
      total: totalIssues,
      pending: openIssues + inProgressIssues,
      resolved: resolvedIssues,
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI SERVICE ROUTES ---

app.get('/api/ai-insights', authMiddleware, async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { status: { not: 'Archived' } }
    });
    const formattedIssues = issues.map(i => ({
      title: i.title,
      category: i.category,
      priority: i.priority
    }));

    const analyzeUrl = AI_SERVICE_URL.replace('/predict', '/analyze');
    const response = await axios.post(analyzeUrl, { issues: formattedIssues });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed: ' + err.message });
  }
});

app.post('/api/ai-insights', async (req, res) => {
  try {
    const { title, description } = req.body;
    const response = await axios.post(AI_SERVICE_URL, { title, description });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'AI prediction failed: ' + err.message });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
