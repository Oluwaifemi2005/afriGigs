import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import User from './models/User.js';
import JobTask from './models/JobTask.js';

dotenv.config();

const app = express();

// Connect to MongoDB
// connectDB();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root and Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'GigAfrik API',
    message: 'Localized African Freelance Marketplace Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Seed endpoint for instant Hackathon demo & testing
app.post('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_SEED !== 'true') {
    return res.status(404).json({ success: false, message: 'Demo seeding is disabled.' });
  }
  try {
    await JobTask.deleteMany({});
    await User.deleteMany({});

    // 1. Create Demo Client (Amina - Lagos Enterprise)
    const clientUser = await User.create({
      name: 'Amina Al-Hassan',
      email: 'client@gigafrik.africa',
      password: 'password123',
      role: 'client',
      country: 'Nigeria',
      city: 'Lagos',
      companyName: 'NaijaPay Solutions',
      phone: '+234 803 123 4567',
      bio: 'Fintech product lead empowering SMEs with digital checkout solutions.',
    });

    // 2. Create Demo Developer (Kwame - Accra Frontend Specialist)
    const devUser = await User.create({
      name: 'Kwame Mensah',
      email: 'dev@gigafrik.africa',
      password: 'password123',
      role: 'developer',
      country: 'Ghana',
      city: 'Accra',
      skills: ['React', 'Tailwind CSS', 'Node.js', 'Vite', 'REST APIs'],
      githubOrPortfolio: 'https://github.com/kwamemensah-dev',
      phone: '+233 24 555 7890',
      bio: 'Passionate frontend engineer crafting high-performance, mobile-first web applications across West Africa.',
    });

    // 3. Create Sample Jobs
    const jobs = [
      {
        title: 'Build Mobile-First USSD & QR Payment Web App',
        description: 'We need a responsive web app that allows merchants in Nairobi and Lagos to generate dynamic QR codes and integrate mobile money checkout.',
        category: 'Full Stack',
        budget: 450000,
        currency: 'NGN',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        client: clientUser._id,
        status: 'open',
        paymentStatus: 'unpaid',
      },
      {
        title: 'Agricultural Supply Chain Dashboard UI',
        description: 'Design and implement a clean analytics dashboard for grain farmers in Kenya. Must include export to CSV and lightweight SVG charts.',
        category: 'Frontend',
        budget: 65000,
        currency: 'KES',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        client: clientUser._id,
        developer: devUser._id,
        status: 'in_progress',
        paymentStatus: 'unpaid',
      },
      {
        title: 'E-commerce API Integration for African Fashion Hub',
        description: 'Connect our Express backend with Paystack and Flutterwave webhooks for real-time order confirmation.',
        category: 'Backend',
        budget: 650,
        currency: 'USD',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        client: clientUser._id,
        developer: devUser._id,
        status: 'in_review',
        paymentStatus: 'unpaid',
        deliverables: {
          previewUrl: 'https://preview-fashionhub.afri-demo.vercel.app',
          repoUrl: 'https://github.com/kwamemensah-dev/african-fashion-api',
          notes: 'Webhook listeners tested with live mock events. Included Postman collection and Swagger docs.',
          submittedAt: new Date(),
        },
      },
      {
        title: 'HealthTech Clinic Booking Portal Landing Page',
        description: 'Fast-loading React landing page with localized French/English copy for outpatient clinics in Kigali and Dakar.',
        category: 'UI/UX Design',
        budget: 800000,
        currency: 'RWF',
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        client: clientUser._id,
        developer: devUser._id,
        status: 'completed',
        paymentStatus: 'paid',
        deliverables: {
          previewUrl: 'https://kigali-health-demo.netlify.app',
          repoUrl: 'https://github.com/kwamemensah-dev/kigali-health',
          notes: 'Finished all components and responsive breakpoints.',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        review: {
          rating: 5,
          feedback: 'Exceptional speed and attention to detail. Kwame communicated clearly via WhatsApp throughout!',
          approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
    ];

    await JobTask.insertMany(jobs);

    res.json({
      success: true,
      message: 'Demo dataset successfully seeded for GigAfrik!',
      demoAccounts: {
        client: { email: 'client@gigafrik.africa', password: 'password123' },
        developer: { email: 'dev@gigafrik.africa', password: 'password123' },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

// const PORT = process.env.PORT || 8006;

// app.listen(PORT, () => {
//   console.log(`[GigAfrik Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
// });


const PORT = process.env.PORT || 8006;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `[GigAfrik Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();
