// routes/plants.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth, requireRole } = require('../utils/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user; // { userId, role, name }
    if (user.role === 'ADMIN') {
      const plants = await prisma.plant.findMany({ include: { assignedTo: true } });
      return res.json(plants);
    } else {
      const plants = await prisma.plant.findMany({ where: { assignedToId: user.userId }, include: { observations: true } });
      return res.json(plants);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, scientificName, startDate, assignedToId } = req.body;
    const plant = await prisma.plant.create({
      data: { name, scientificName, startDate: new Date(startDate), assignedToId: assignedToId ? Number(assignedToId) : null }
    });
    res.json(plant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/assign', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { studentId } = req.body;
    const plant = await prisma.plant.update({ where: { id }, data: { assignedToId: Number(studentId) } });
    res.json(plant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
