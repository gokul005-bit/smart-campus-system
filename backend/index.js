const _fs = require('fs');
const { execSync } = require('child_process');

if (!_fs.existsSync(__dirname + '/.setup_done')) {
  try {
    console.log("\n=============================================");
    console.log("   AUTO-CONFIGURING LOCAL SQLITE DATABASE    ");
    console.log("=============================================\n");
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: __dirname, shell: true });
    execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname, shell: true });
    _fs.writeFileSync(__dirname + '/.setup_done', 'true');
    console.log("\n=============================================");
    console.log("    DATABASE SUCCESSFULLY GENERATED!         ");
    console.log("=============================================\n");
  } catch(e) {
    console.error("Auto-fix error:", e.message);
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
require('dotenv').config();

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

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can register students' });
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: role || 'STUDENT' }
    });

    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hardcoded Admin Logic
    if (email === 'admin' && password === 'admin') {
      const token = jwt.sign({ id: 0, email: 'admin', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1d' });
      return res.json({ token, role: 'ADMIN', email: 'admin' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Student ID not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ISSUE ROUTES ---

app.post('/api/issues', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, location } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Missing fields' });

    let category = 'Other';
    try {
      const aiResponse = await axios.post(AI_SERVICE_URL, { description: title + " " + description });
      category = aiResponse.data.category;
    } catch (aiError) {
      console.error('AI Error:', aiError.message);
    }

    const priority = determinePriority(title, description);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newIssue = await prisma.issue.create({
      data: {
        title,
        description,
        location: location || 'Unknown',
        category,
        priority,
        status: 'Open',
        imageUrl,
        userId: req.user.id
      }
    });

    // Broadcast new issue to all connected dashboards
    io.emit('new_issue', newIssue);

    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/issues', authMiddleware, async (req, res) => {
  try {
    const whereClause = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const issues = await prisma.issue.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/issues/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { status } = req.body;

    const updatedIssue = await prisma.issue.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });

    // Broadcast issue status change to all connected clients
    io.emit('issue_updated', updatedIssue);

    res.json(updatedIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ANALYTICS & AI ---

app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const total = await prisma.issue.count({ where: { status: { not: 'Archived' } } });
    const resolved = await prisma.issue.count({ where: { status: 'Resolved' } });
    const pending = total - resolved;
    const categoryCounts = await prisma.issue.groupBy({
      by: ['category'],
      where: { status: { not: 'Archived' } },
      _count: { category: true }
    });
    res.json({ total, resolved, pending, byCategory: categoryCounts.map(c => ({ category: c.category, count: c._count.category })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai-insights', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

    // Fetch all true active issues to summarize (excluding resolved and archived ones)
    const openIssues = await prisma.issue.findMany({ where: { status: { notIn: ['Resolved', 'Archived'] } } });

    let aiInsight = "No specific AI insights currently available.";

    // Send standard summary directly over to a new specialized AI endpoint, 
    // or just calculate the basic heuristics if the ML service is simple.
    // For realistic viva demo, since our AI is a text classifier, we will build a basic NLP logic text generator directly here,
    // OR we can query the Python service. I will build an endpoint in FastAPI and query it!

    try {
      const summaryPayload = { issues: openIssues.map(i => ({ title: i.title, category: i.category, priority: i.priority })) };
      const aiResponse = await axios.post(`${AI_SERVICE_URL.replace('/predict', '/analyze')}`, summaryPayload);
      aiInsight = aiResponse.data.insight;
    } catch (aiError) {
      console.error('Insights Error:', aiError.message);
      aiInsight = "System has detected multiple open records but AI analysis module is unavailable.";
    }

    res.json({ insight: aiInsight });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
