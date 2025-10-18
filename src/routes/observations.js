// routes/observations.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinaryService = require('../services/cloudinary');
const { requireAuth } = require('../utils/auth');

const router = express.Router();

// create observation (multipart/form-data expected by multer)
router.post('/', requireAuth, async (req, res) => {
  try {
    // multer attached buffer at req.file (see index.js middleware wiring)
    const uploadMiddleware = req.upload.single('image');
    uploadMiddleware(req, res, async function (err) {
      if (err) return res.status(400).json({ error: 'Upload error' });
      const { plantId, date, heightCm, leafCount, color, notes } = req.body;
      const studentId = req.user.userId;
      let imageUrl = null;
      if (req.file && req.file.buffer) {
        // Upload to Cloudinary and get URL
        imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, req.file.originalname);
      }
      const obs = await prisma.observation.create({
        data: {
          plantId: Number(plantId),
          studentId: Number(studentId),
          date: date ? new Date(date) : new Date(),
          heightCm: Number(heightCm) || 0,
          leafCount: Number(leafCount) || 0,
          color: color || null,
          notes: notes || null,
          imageUrl: imageUrl
        }
      });
      res.json(obs);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// list observations with optional filters
router.get('/', requireAuth, async (req, res) => {
  try {
    const { plantId, from, to } = req.query;
    const where = {};
    if (plantId) where.plantId = Number(plantId);
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(String(from));
      if (to) where.date.lte = new Date(String(to));
    }
    const list = await prisma.observation.findMany({ where, orderBy: { date: 'asc' } });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// aggregate for chart (daily average)
router.get('/aggregate', requireAuth, async (req, res) => {
  try {
    const { plantId } = req.query;
    if (!plantId) return res.status(400).json({ error: 'plantId required' });
    // Raw query returns day + averages; Prisma will accept raw SQL for MySQL
    const results = await prisma.$queryRawUnsafe(`
      SELECT DATE(date) AS day, AVG(heightCm) AS avg_height, AVG(leafCount) AS avg_leaf
      FROM Observation
      WHERE plantId = ${Number(plantId)}
      GROUP BY day
      ORDER BY day;
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
