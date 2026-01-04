import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173', FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import contactRoutes from './routes/contacts';
import itemRoutes from './routes/items';
import quoteRoutes from './routes/quotes';
import invoiceRoutes from './routes/invoices';
import projectRoutes from './routes/projects';
import timesheetRoutes from './routes/timesheets';
import templateRoutes from './routes/templates';
import dashboardRoutes from './routes/dashboard';
import paymentRoutes from './routes/payments';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize templates on server startup
import { initializeAllTemplates } from './utils/templateHelper';
import { syncAllTemplateFiles } from './utils/syncTemplateFiles';
import { cleanupDuplicateTemplates } from './utils/cleanupTemplates';

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Cleanup duplicate templates first
  try {
    await cleanupDuplicateTemplates();
  } catch (error) {
    console.error('❌ Error cleaning up templates:', error);
  }
  
  // Initialize all templates
  try {
    await initializeAllTemplates();
    console.log('✅ All templates initialized successfully');
    
    // Sync all existing templates to .hbs files (ensures all templates have files)
    await syncAllTemplateFiles();
    console.log('✅ All template files synced successfully');
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
  }
});

