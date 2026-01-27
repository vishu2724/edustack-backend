# EduStack – Course Selling Platform (Backend)
A scalable Node.js backend for a course selling platform featuring JWT authentication, role-based access control, and MongoDB Atlas integration.

This repository contains the **backend** of the full-stack **EduStack – Course Selling Platform**, built using **Node.js, Express.js, and MongoDB**.

## 🔗 Related Links
- **Frontend Repository:** https://github.com/vishu2724/edustack-frontend
- **Live Application:** https://edustack-frontend-seven.vercel.app/

## 🚀 Tech Stack
- Node.js
- Express.js
- MongoDB (Atlas)
- JWT Authentication
- Zod Validation
- Mongoose

## ✨ Features
- User & Admin authentication using JWT
- Role-based access control (Admin / User)
- Course CRUD APIs
- Secure purchase flow APIs
- Middleware-protected routes
- Input validation using Zod
- MongoDB Atlas integration

## 📂 Project Structure
```text
.
├── middleware/       # Authentication & authorization middlewares
├── models/           # Mongoose schemas
├── routes/           # Express routes
├── config.js         # Database & app configuration
├── index.js          # Entry point of the application
├── .env.example      # Environment variable template
└── package.json

🛠️ Setup Instructions

1️⃣ Clone the repository
git clone https://github.com/vishu2724/edustack-backend
cd edustack-backend

2️⃣ Install dependencies
npm install

3️⃣ Setup environment variables
Create a .env file using .env.example:

PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret

4️⃣ Run the server
npm run dev


Server will start at:
http://localhost:5000

🔐 Authentication Flow
JWT tokens generated on login
Tokens verified via authentication middleware
Role-based access enforced on protected routes

🧠 Notes
MongoDB Atlas is used for database hosting
Ensure environment variables are configured correctly before running the app
Frontend communicates via REST APIs

⭐ If you find this project useful, feel free to star the repository!
