# Smart Campus Issue Prediction & Resolution System
## Final Study Report & Architecture Overview

This document is designed for studying purposes. It explains the core features of the system, the overall architecture, and provides an in-depth breakdown of every technology and package used across the project, including *why* it was chosen and what role it plays.

---

## 1. Project Overview

The Smart Campus System is an enterprise-grade web application designed to help university administrators efficiently track, manage, and predict campus issues (e.g., maintenance, IT, infrastructure). The application uses artificial intelligence to predict issue categories and priority, real-time websockets to keep dashboards updated instantly, and secure authentication to ensure only authorized personnel can access sensitive data.

---

## 2. Core Features

- **Secure Role-Based Authentication:** Uses a secure login flow restricting access to authorized administrators. Employs securely hashed passwords and temporary access tokens.
- **AI Issue Prediction:** Automatically predicts the category and priority of a newly submitted issue based on its description using a trained Machine Learning model.
- **Real-Time Updates:** When a new issue is submitted or updated, connected users see the changes on their dashboard instantly without needing to refresh the page.
- **Interactive Analytics Dashboard:** Visualizes issue data through interactive Pie Charts and metrics (e.g., open vs. resolved tickets), allowing admins to quickly assess the campus's current status.
- **Evidence Management (File Uploads):** Allows users to upload images as evidence when reporting an issue.
- **Comprehensive Issue Management:** Administrators can update issue statuses (e.g., from "Open" to "In Progress" or "Resolved"), archive older issues, or delete invalid ones.

---

## 3. Technology Stack & Package Explanations

The project is divided into three distinct services. Here is an explanation of the dependencies utilized in each and why they exist:

### A. Frontend (User Interface)
The frontend is what the administrator interacts with on their browser.

* **[React](https://react.dev/) (`react`, `react-dom`)**
  * **What it is:** A JavaScript library for building user interfaces using reusable components.
  * **Why it's used:** It allows us to manage complex, dynamic states (like when new data arrives from the server) efficiently without reloading the page.
* **[Vite](https://vitejs.dev/) (`vite`)**
  * **What it is:** A fast frontend build tool.
  * **Why it's used:** Replaces Webpack or Create-React-App to provide lightning-fast hot module replacement (HMR), drastically speeding up development time.
* **[Tailwind CSS](https://tailwindcss.com/) (`tailwindcss`)**
  * **What it is:** A utility-first CSS framework.
  * **Why it's used:** Allows for building a premium, modern, and highly responsive aesthetic directly inside React components without writing separate `.css` files.
* **[Framer Motion](https://www.framer.com/motion/) (`framer-motion`)**
  * **What it is:** A production-ready animation library for React.
  * **Why it's used:** Adds smooth micro-animations, transitions, and hover effects that give the application a premium, dynamic feel.
* **[Recharts](https://recharts.org/) (`recharts`)**
  * **What it is:** A composable charting library built on React components.
  * **Why it's used:** Powers the interactive pie charts and data visualizations on the admin dashboard.
* **[React Router](https://reactrouter.com/) (`react-router-dom`)**
  * **What it is:** The standard routing library for React.
  * **Why it's used:** Allows navigating between different pages (like Dashboard, Login, Settings) while keeping the application as a Single Page Application (SPA).
* **[Socket.io-client](https://socket.io/) (`socket.io-client`)**
  * **What it is:** The client-side library for managing WebSockets.
  * **Why it's used:** Listens to the backend for real-time events (like `issue_created`) and updates the React state immediately.
* **[Axios](https://axios-http.com/) (`axios`)**
  * **What it is:** Promise-based HTTP client.
  * **Why it's used:** Sends asynchronous requests (GET, POST) to the backend API smoothly.
* **[Lucide React](https://lucide.dev/) (`lucide-react`)**
  * **What it is:** A beautifully designed icon library.
  * **Why it's used:** Provides consistent and visually appealing standard icons across the UI.

### B. Backend (API & Business Logic)
The backend manages data verification, routes, and database communication.

* **[Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) (`express`)**
  * **What it is:** Node is the runtime environment, Express is the web routing framework.
  * **Why it's used:** Provides a fast, scalable environment to create RESTful API endpoints for the frontend to consume.
* **[Prisma](https://www.prisma.io/) (`@prisma/client`, `prisma`)**
  * **What it is:** A modern Object-Relational Mapper (ORM).
  * **Why it's used:** Replaces raw SQL queries. It automatically generates safe TypeScript/JavaScript database client code based on a provided schema, preventing SQL injection and simplifying database (PostgreSQL) interactions.
* **[PostgreSQL](https://www.postgresql.org/)**
  * **What it is:** An advanced, open-source relational database.
  * **Why it's used:** Robustly stores all app data (users, issues, feedback) in structured tables.
* **[JSON Web Token](https://jwt.io/) (`jsonwebtoken`)**
  * **What it is:** A standard for securely transmitting info as a JSON object.
  * **Why it's used:** After a user logs in, they are issued a JWT token. This token acts as a "digital pass" required to access secure endpoints like the admin dashboard.
* **[Bcryptjs](https://www.npmjs.com/package/bcryptjs) (`bcryptjs`)**
  * **What it is:** A password-hashing function library.
  * **Why it's used:** Converts plain-text passwords into encrypted hashes before storing them in the database for security.
* **[Socket.io](https://socket.io/) (`socket.io`)**
  * **What it is:** The server-side component for real-time bi-directional event communication.
  * **Why it's used:** Pushes updates instantly to connected administrators when issue statuses change without them needing to refresh the page.
* **[Multer](https://github.com/expressjs/multer) (`multer`)**
  * **What it is:** A middleware for handling `multipart/form-data`.
  * **Why it's used:** Used specifically for capturing and saving image files uploaded via the frontend when users report evidence of a campus issue.
* **[CORS](https://www.npmjs.com/package/cors) (`cors`) & [Dotenv](https://www.npmjs.com/package/dotenv) (`dotenv`)**
  * **What it is:** Utility libraries.
  * **Why it's used:** CORS allows the frontend (say, running on localhost:5173) to securely request data from the backend (localhost:5000). Dotenv keeps secure variables (like database URLs or secret keys) safe in environment files instead of source code.

### C. AI Service (Machine Learning)
A standalone microservice that predicts the nature of a campus issue.

* **[FastAPI](https://fastapi.tiangolo.com/) (`fastapi`) & [Uvicorn](https://www.uvicorn.org/) (`uvicorn`)**
  * **What it is:** A modern, incredibly fast Python web framework and its server.
  * **Why it's used:** Specifically chosen to quickly receive text from the Node.js backend, run it against the AI model, and return the prediction in milliseconds.
* **[Scikit-Learn](https://scikit-learn.org/) (`scikit-learn`)**
  * **What it is:** A widely-used Python Machine Learning library.
  * **Why it's used:** Utilized here to train and execute models (likely text classification models like Naive Bayes or SVM) to predict if an issue is "Maintenance", "IT", etc., based solely on user text.
* **[Pandas](https://pandas.pydata.org/) (`pandas`)**
  * **What it is:** A powerful data analysis & manipulation library.
  * **Why it's used:** Handles the dataset loading and preprocessing when training the machine learning model.
* **[Pydantic](https://docs.pydantic.dev/) (`pydantic`)**
  * **What it is:** Data validation library.
  * **Why it's used:** Enforces strict data types for the inputs sent to the FastAPI server. If the Node.js backend sends badly formatted data, Pydantic catches it immediately, preventing AI service crashes.
* **Pickle (Python standard library)**
  * **What it is:** Python object serialization module.
  * **Why it's used:** Allows the pre-trained Scikit-Learn model to be saved as a file (`model.pkl`) and loaded into FastAPI seamlessly without needing to retrain every time the server starts.

---

## 4. System Operation Workflow (How it all connects)

1. **User Action:** A user fills out the "Report Issue" form on the **React** frontend and uploads an image. 
2. **File Processing:** The data is pushed via an **Axios** HTTP request to the **Express** backend. **Multer** catches the image and saves it to disk.
3. **AI Prediction:** The **Express** backend sends the text description to the Python **FastAPI** service. The Python service uses **Scikit-learn** and `model.pkl` to predict the category, and returns it to Express.
4. **Database Save:** **Prisma** takes the new issue (including the AI-predicted category and the image path) and securely writes it to the **PostgreSQL** database.
5. **Real-time broadcast:** The **Express** backend triggers a **Socket.io** event `new_issue`.
6. **UI Update:** The **React** frontend listens to `new_issue`, instantly updates its state, and **Framer Motion** animates the new issue card into view, while **Recharts** animates an update to its Pie Charts.
