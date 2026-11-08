import { Router } from 'express';
import prisma from '../config/prisma.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { notifyLearningCenterUpdated } from '../services/notificationService.js';

const router = Router();

// Helper: transform Prisma model to frontend response format
function formatCenter(c) {
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    type: c.type,
    address: c.locationAddress || '',
    location_address: c.locationAddress || '',
    barangay: c.barangay || '',
    municipality: c.municipality || 'Naawan',
    province: c.province || 'Misamis Oriental',
    contact_person: c.contactPerson || '',
    contact_number: c.contactPhone || '',
    status: c.status || 'active',
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

// ---------------------
// GET /api/learning-centers
// List all learning centers
// ---------------------
router.get('/', async (_req, res, next) => {
  try {
    const centers = await prisma.learningCenter.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(centers.map(formatCenter));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/learning-centers/count
// Get total count of learning centers
// ---------------------
router.get('/count', async (_req, res, next) => {
  try {
    const count = await prisma.learningCenter.count();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/learning-centers/:id
// Get a single learning center
// ---------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learning center ID' });
    }

    const center = await prisma.learningCenter.findUnique({
      where: { id },
    });

    if (!center) {
      return res.status(404).json({ error: 'Learning center not found' });
    }

    res.json(formatCenter(center));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/learning-centers
// Create a new learning center
// ---------------------
router.post('/', async (req, res, next) => {
  try {
    const { name, address, contact_person, contact_number, status, type, barangay } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const trimmedName = name.trim();
    const code = 'CLC_' + trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');

    const center = await prisma.learningCenter.create({
      data: {
        code,
        name: trimmedName,
        type: type?.trim() || 'Community Learning Center (CLC)',
        locationAddress: address?.trim() || '',
        barangay: barangay?.trim() || '',
        contactPerson: contact_person?.trim() || '',
        contactPhone: contact_number?.trim() || '',
        status: status || 'active',
      },
    });

    res.status(201).json(formatCenter(center));
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A learning center with this name or code already exists' });
    }
    next(err);
  }
});

// ---------------------
// PUT /api/learning-centers/:id
// Update an existing learning center
// ---------------------
router.put('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learning center ID' });
    }

    const { name, address, contact_person, contact_number, status, type, barangay } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (address !== undefined) data.locationAddress = address.trim();
    if (contact_person !== undefined) data.contactPerson = contact_person.trim();
    if (contact_number !== undefined) data.contactPhone = contact_number.trim();
    if (status !== undefined) data.status = status;
    if (type !== undefined) data.type = type.trim();
    if (barangay !== undefined) data.barangay = barangay.trim();

    const center = await prisma.learningCenter.update({
      where: { id },
      data,
    });

    notifyLearningCenterUpdated({
      centerId: center.id,
      updaterName: req.user?.adminProfile?.fullName || req.user?.teacherProfile?.fullName || req.user?.username,
      updaterRole: req.user?.role,
    }).catch((e) => console.error('[LearningCenters] notifyLearningCenterUpdated error:', e));

    res.json(formatCenter(center));
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Learning center not found' });
    }
    next(err);
  }
});

// ---------------------
// DELETE /api/learning-centers/:id
// Delete a learning center
// ---------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learning center ID' });
    }

    await prisma.learningCenter.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Learning center not found' });
    }
    next(err);
  }
});

export default router;
