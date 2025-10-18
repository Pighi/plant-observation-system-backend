// index.js - Plant Observation API (Express + Prisma + Cloudinary)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const plantRoutes = require('./routes/plants');
const observationRoutes = require('./routes/observations');

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// file uploads in memory
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });

// routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/observations', (req, res, next) => { req.upload = upload; next(); }, observationRoutes);

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on port ${port}`));
