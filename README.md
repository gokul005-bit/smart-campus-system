# Smart Campus Issue Prediction and Resolution System

A full-stack system consisting of a React UI, Node.js backend, FastAPI machine learning service, and a PostgreSQL database. The application automates the categorization and priority assignment of campus issues reported by users.

## How to Run the Application

This application requires four separate processes/windows. Follow these steps sequentially:

### Step 1: Initialize Database Tables
*(Already done for you! The backend connects directly to your PG Admin)*
Open a terminal inside the `/backend` folder. Install dependencies and run Prisma:
```bash
cd backend
npm install
npx prisma db push
```
```bash
cd backend
npm install
npx prisma db push
```

### Step 3: Start the AI Service
Open a terminal inside the `/ai-service` folder. Install Python dependencies, train the model, and start the server:
```bash
cd ai-service
pip install -r requirements.txt
python train.py
uvicorn app:app --host 127.0.0.1 --port 8000
```
*Wait until you see "Application startup complete."*

### Step 4: Start the Node.js Backend
The database and AI service are now running. Let's start the API Backend. Open a terminal inside the `/backend` folder:
```bash
cd backend
npm run dev
```

### Step 5: Start the React Frontend
Open a terminal inside the `/frontend` folder. Install dependencies and start the UI:
```bash
cd frontend
npm install
npm run dev
```
Click the local link (`http://localhost:5173`) generated here.
