// server.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Enable CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Init middleware
app.use(express.json({ extended: false }));

// Define routes
app.use('/api/auth', require('./routes/auth'));

// Add test endpoints
app.get('/api/test', (req, res) => res.json({ message: 'API is working' }));
app.get('/api/auth/test', (req, res) => res.json({ message: 'Auth routes are working' }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));