const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const industryLeadsRoutes = require('./routes/industryLeads');
const showLeadsRoutes = require('./routes/showLead');
const dealRoutes = require('./routes/deal');
const invoiceRoutes = require('./routes/Invoice');
const contactRoutes = require('./routes/contacts')
const salaryRoutes = require('./routes/salary');
require('dotenv').config();

if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI environment variable is required!");
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://crm-admin-panel.vercel.app', // You'll update this after Vercel
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Health check route for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from src directory
app.use(express.static(path.join(__dirname, '../src')));
app.use('/api/contacts', contactRoutes);
app.use('/api/salary', salaryRoutes);
// Specific routes for different sections
app.use('/api/deals', dealRoutes);
app.use('/deals', express.static(path.join(__dirname, '../src/DEAL')));
app.use('/globentix-login', express.static(path.join(__dirname, '../src/globentix-login')));
app.use('/login', express.static(path.join(__dirname, '../src/globentix-login')));
app.use('/main', express.static(path.join(__dirname, '../src/MAIN_PAGE')));
app.use('/show_new_demo', express.static(path.join(__dirname, '../src/show_new_demo')));
app.use('/assets', express.static(path.join(__dirname, '../src/Asset')));
app.use('/api/invoices', invoiceRoutes);
app.use('/api/industry-leads', industryLeadsRoutes);
app.use('/api/show-leads', showLeadsRoutes); // Add this line
app.use('/salary', express.static(path.join(__dirname, '../src/SALARY')));

// ADD THIS: Serve Industry Leads static files
app.use('/industry-leads', express.static(path.join(__dirname, '../src/INDUSTRY_LEAD_PAGE')));

// FIXED: Add static file serving for leads page assets
app.use('/leads', express.static(path.join(__dirname, '../src/show_new_demo')));

// API Routes
app.use('/api/auth', authRoutes);

// HTML Routes

app.use('/contacts', express.static(path.join(__dirname, '../src/CONTACT')));

app.use('/invoice', express.static(path.join(__dirname, '../src/INVOICE')));


app.get('/', (req, res) => {
  res.redirect('/globentix-login');
});

app.get('/globentix-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/globentix-login/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/MAIN_PAGE/index.html'));
});

app.get('/leads', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/show_new_demo/show.html'));
});

// Add routes for other pages as well
app.get('/industry-leads', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/INDUSTRY_LEAD_PAGE/demo.html'));
});

app.get('/deals', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/DEAL/deal.html'));
});

app.get('/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/CONTACT/contact.html'));
});

app.get('/invoice', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/INVOICE/invoice.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/REPORTS/reports.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/SETTINGS/setting.html'));
});

app.get('/salary', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/SALARY/Salary.html'));
});

// Logout route
app.get('/logout', (req, res) => {
  res.redirect('/globentix-login');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));