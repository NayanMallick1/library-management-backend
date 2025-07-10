const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const db = require('./db'); // mysql2/promise pool
const PORT = process.env.PORT || 3000;

const app = express();

// Test DB connection on startup
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
})();

// Configure file upload storage
const uploadDir = path.join('/Users/nayanmallick/Desktop/MyJava/my-app', 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname) !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend origin
  credentials: true,               // Allow cookies to be sent cross-origin
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup with improved cookie options
app.use(session({
  secret: '8f0db7b90c65d1cfe45ee2fd223060a3c8ba94b12265400c8d5c71ebc36fbe2367ac4a1cf14d3bb69174a442e2700a23a6b60c7bb6b30de169d864c223a0363f', // Change for production, use env var
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,    // false for local HTTP; true if using HTTPS in production
    httpOnly: true,   // Helps prevent client-side JS access to cookie
    sameSite: 'lax',  // Helps cookies be sent in cross-site requests for most cases
  },
}));

// Auth middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

// Publisher-only middleware
function requirePublisher(req, res, next) {
  if (req.session.user?.role !== 'publisher') {
    return res.status(403).json({ success: false, message: 'Publisher access required' });
  }
  next();
}

// Serve static pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/books', (req, res) => res.sendFile(path.join(__dirname, 'views', 'books.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'views', 'contact.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Add publisher dashboard route
app.get('/publisher-dashboard', requireAuth, (req, res) => {
  if (req.session.user.role === 'publisher') {
    res.sendFile(path.join(__dirname, 'views', 'publisher-dashboard.html'));
  } else {
    res.redirect('/dashboard');
  }
});

// Register route with role validation
app.post('/api/register', async (req, res) => {
  const { name, email, username, password, confirmPassword, role = 'user' } = req.body;

  // Password confirmation check
  if (password !== confirmPassword) {
    return res.redirect('/register?error=password_mismatch');
  }

  // Validate role
  if (!['user', 'publisher'].includes(role)) {
    return res.redirect('/register?error=invalid_role');
  }

  try {
    // Check if username or email already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.redirect('/register?error=user_exists');
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database with role
    const [result] = await db.query(
      'INSERT INTO users (name, email, username, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, username, hashedPassword, role]
    );

    // Set session user on registration success with role
    req.session.user = { id: result.insertId, name, username, role };
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/register?error=session_error');
      }
      // Redirect to appropriate dashboard based on role
      const redirectPath = role === 'publisher' ? '/publisher-dashboard' : '/dashboard';
      res.redirect(redirectPath);
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.redirect('/register?error=server_error');
  }
});

// Login route with role
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.query(
      'SELECT id, name, username, password, role FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Include role in session user object
    req.session.user = { 
      id: user.id, 
      name: user.name, 
      username: user.username,
      role: user.role
    };
    
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session error' });
      }
      // Return role in response so frontend can redirect if needed
      res.json({ 
        success: true, 
        user: req.session.user,
        redirectTo: user.role === 'publisher' ? '/publisher-dashboard' : '/dashboard'
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get current logged-in user data (now includes role)
app.get('/api/user-data', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json(null);
  }
});

// User stats (protected)
app.get('/api/user-stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const [borrowedRows] = await db.query('SELECT COUNT(*) AS count FROM borrowed_books WHERE user_id = ?', [userId]);
    const [reservedRows] = await db.query('SELECT COUNT(*) AS count FROM reserved_books WHERE user_id = ?', [userId]);
    const [dueSoonRows] = await db.query(
      `SELECT COUNT(*) AS count FROM borrowed_books 
       WHERE user_id = ? AND due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)`,
      [userId]
    );

    res.json({
      borrowedCount: borrowedRows[0].count,
      reservedCount: reservedRows[0].count,
      dueSoonCount: dueSoonRows[0].count
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user stats' });
  }
});

// Book search API
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  try {
    const [results] = await db.query(
      `SELECT * FROM books WHERE title LIKE ? OR author LIKE ? LIMIT 20`,
      [`%${query}%`, `%${query}%`]
    );
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Error searching books' });
  }
});

// Borrow book API (protected)
app.post('/api/borrow', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const { bookId } = req.body;

  try {
    const [books] = await db.query('SELECT * FROM books WHERE id = ?', [bookId]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const [existing] = await db.query(
      'SELECT * FROM borrowed_books WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have this book borrowed' });
    }

    await db.query(
      `INSERT INTO borrowed_books (user_id, book_id, borrowed_date, due_date)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))`,
      [userId, bookId]
    );

    res.json({ success: true, message: 'Book borrowed successfully' });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({ success: false, message: 'Error borrowing book' });
  }
});

// Recently Borrowed Books API
app.get('/api/recently-borrowed', requireAuth, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        b.title, b.author, bb.borrowed_date, bb.due_date
      FROM 
        borrowed_books bb
      JOIN 
        books b ON bb.book_id = b.id
      WHERE 
        bb.user_id = ?
      ORDER BY 
        bb.borrowed_date DESC
      LIMIT 5;
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching recently borrowed books:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch borrowed books' });
  }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name, email, and message are required' 
    });
  }

  try {
    await db.query(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
      // submitted_at will automatically be set by MySQL
    );

    res.json({ 
      success: true, 
      message: 'Message sent successfully!',
      data: { name, email } // Optional: return some submitted data
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: error.message // Optional: include error details for debugging
    });
  }
});

// Add book endpoint with PDF upload
app.post('/api/add-book', requireAuth, requirePublisher, upload.single('pdf'), async (req, res) => {
  try {
    const { title, author, year, description } = req.body;
    const publisherId = req.session.user.id;

    let pdfUrl = null;
    if (req.file) {
      // Create a relative path for the database
      pdfUrl = '/uploads/' + path.basename(req.file.path);
    }

    const [result] = await db.query(
      `INSERT INTO books 
       (title, author, year, overview, pdf_url, publisher_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, author, year, description, pdfUrl, publisherId]
    );

    res.json({ 
      success: true,
      bookId: result.insertId,
      message: 'Book added successfully'
    });
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error adding book' 
    });
  }
});

// Get publisher's published books
app.get('/api/published-books', requireAuth, requirePublisher, async (req, res) => {
  try {
    const [books] = await db.query(
      `SELECT id, title, author, year, overview AS description, pdf_url 
       FROM books WHERE publisher_id = ?`,
      [req.session.user.id]
    );
    res.json(books);
  } catch (error) {
    console.error('Published books error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching published books' 
    });
  }
});

// Publisher-only API example
app.get('/api/publisher-dashboard', requireAuth, requirePublisher, async (req, res) => {
  try {
    // Example publisher-specific data
    const [books] = await db.query('SELECT COUNT(*) AS count FROM books WHERE publisher_id = ?', [req.session.user.id]);
    res.json({ booksCount: books[0].count });
  } catch (error) {
    console.error('Publisher dashboard error:', error);
    res.status(500).json({ success: false, message: 'Error fetching publisher data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});