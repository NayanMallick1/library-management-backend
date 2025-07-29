# library-management-backend
📚 Library Management System — Backend (Node.js + MySQL)
This backend powers a Library Management System where users can browse and borrow books, while publishers can upload and manage book content. It uses Node.js, Express, MySQL, and Multer for file uploads.

⚙️ Features
🔐 Authentication & Sessions
Separate login/signup for:

📘 Users (can browse, borrow, rate, and review books)

✍️ Publishers (can upload and manage books)

Secure password hashing with bcrypt

User sessions handled with express-session

🧑‍💼 User Dashboard
Search and browse all available books

View borrowed books

Submit ratings and reviews

🖋️ Publisher Dashboard
Upload books in PDF format (stored locally in uploads/)

Add metadata: Title, Author, Year, Overview

Manage uploaded books

🌍 CORS & API
CORS enabled to connect with frontend (HTML/CSS/JS)

RESTful API structure using Express routes

🗃️ Database (MySQL)
MySQL used for storing:

User and publisher data

Book metadata

Reviews and borrowing logs

Connection handled via mysql2/promise for async support

