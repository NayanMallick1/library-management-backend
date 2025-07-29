# library-management-backend
📚 Library Management System — Backend (Node.js + MySQL)
This backend powers a Library Management System where users can browse and borrow books, while publishers can upload and manage book content. It uses Node.js, Express, MySQL, and Multer for file uploads.

<img width="1420" height="694" alt="Screenshot 2025-07-29 at 20 50 04" src="https://github.com/user-attachments/assets/0801da85-f886-4c18-9895-49075d825fd0" />


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

<img width="1440" height="900" alt="Screenshot 2025-07-29 at 20 51 58" src="https://github.com/user-attachments/assets/78c4a171-c8de-43ec-b946-7862316a4874" />

🖋️ Publisher Dashboard
Upload books in PDF format (stored locally in uploads/)
Add metadata: Title, Author, Year, Overview
Manage uploaded books

<img width="1440" height="900" alt="Screenshot 2025-07-29 at 20 56 20" src="https://github.com/user-attachments/assets/4b98fb63-805d-412e-92e0-d88ca7ecaa29" />

<img width="1440" height="900" alt="Screenshot 2025-07-29 at 20 56 29" src="https://github.com/user-attachments/assets/2563ec05-8138-4f68-a9ea-9056864cbe9a" />

🌍 CORS & API
CORS enabled to connect with frontend (HTML/CSS/JS)
RESTful API structure using Express routes

🗃️ Database (MySQL)
MySQL used for storing:
User and publisher data
Book metadata
Reviews and borrowing logs
Connection handled via mysql2/promise for async support

**BOOKS TABLES**
<img width="929" height="155" alt="Screenshot 2025-07-29 at 20 58 43" src="https://github.com/user-attachments/assets/a20b4726-1f0d-4b5e-970f-839a028c0fd4" />

**USERS TABLES**

<img width="760" height="96" alt="image" src="https://github.com/user-attachments/assets/e0ddbc3e-85ef-4e1a-acfd-d6f21eefeefb" />

**BORROWED BOOKS**

<img width="299" height="94" alt="image" src="https://github.com/user-attachments/assets/2e59401d-14da-4e3c-a630-76c65d84890f" />


📂 Folder Structure
/backend


<img width="648" height="248" alt="image" src="https://github.com/user-attachments/assets/f4384cf8-b557-469e-bb0f-018bb4825091" />


📦 Dependencies

express
mysql2
bcrypt
express-session
multer
cors
dotenv
fs (Node.js native)
path (Node.js native)






