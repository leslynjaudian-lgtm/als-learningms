import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

export function normalizeLearningAreaStatus(raw) {
  return String(raw || 'Active').trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
}

export function formatLearningArea(area) {
  if (!area) return null;
  return {
    id: area.id,
    code: String(area.code || '').trim(),
    name: String(area.name || '').trim(),
    description: area.description || '',
    sortOrder: area.sortOrder ?? 1,
    status: normalizeLearningAreaStatus(area.status),
    moduleCount: area._count?.modules ?? undefined,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt,
  };
}

// ---------------------
// GET /api/learning-areas
// List learning areas (optionally filtered to active only)
// ---------------------
router.get('/', async (req, res, next) => {
  try {
    const { status, activeOnly } = req.query;
    const onlyActive =
      String(activeOnly || '').toLowerCase() === 'true' ||
      String(status || '').trim().toLowerCase() === 'active';
    const onlyInactive = String(status || '').trim().toLowerCase() === 'inactive';

    const areas = await prisma.learningArea.findMany({
      include: {
        _count: {
          select: { modules: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    let formatted = areas.map(formatLearningArea);
    if (onlyActive) {
      formatted = formatted.filter((a) => a.status === 'Active');
    } else if (onlyInactive) {
      formatted = formatted.filter((a) => a.status === 'Inactive');
    }

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/learning-areas/:id
// Get a single learning area by database ID
// ---------------------
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learning area ID' });
    }

    const area = await prisma.learningArea.findUnique({
      where: { id },
      include: {
        _count: {
          select: { modules: true },
        },
      },
    });

    if (!area) {
      return res.status(404).json({ error: 'Learning area not found' });
    }

    res.json(formatLearningArea(area));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/learning-areas
// Create a new learning area (Admin only)
// Allows multiple strands to share the same Learning Strand Code (e.g. LS1),
// while preventing duplicate Learning Strand Names.
// ---------------------
router.post('/', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { code, name, description, status, sortOrder } = req.body;

    const trimmedCode = String(code ?? '').trim();
    const trimmedName = String(name ?? '').trim();
    const trimmedDescription = description !== undefined && description !== null ? String(description).trim() : '';

    if (!trimmedCode) {
      return res.status(400).json({ error: 'Learning Strand Code is required.' });
    }
    if (trimmedCode.length > 50) {
      return res.status(400).json({ error: 'Learning Strand Code must be 50 characters or fewer.' });
    }
    if (!trimmedName) {
      return res.status(400).json({ error: 'Learning Strand Name is required.' });
    }
    if (trimmedName.length > 150) {
      return res.status(400).json({ error: 'Learning Strand Name must be 150 characters or fewer.' });
    }

    // Prevent duplicate Learning Areas by name (same code across distinct strands is allowed)
    const existingAreas = await prisma.learningArea.findMany({
      select: { id: true, name: true, sortOrder: true },
    });
    const duplicate = existingAreas.find(
      (a) => String(a.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({
        error: `A learning area named "${trimmedName}" already exists.`,
      });
    }

    const maxSort = existingAreas.reduce(
      (max, a) => (typeof a.sortOrder === 'number' && a.sortOrder > max ? a.sortOrder : max),
      0
    );
    const parsedSortOrder =
      sortOrder !== undefined && !isNaN(parseInt(sortOrder, 10))
        ? parseInt(sortOrder, 10)
        : maxSort + 1;

    const created = await prisma.learningArea.create({
      data: {
        code: trimmedCode,
        name: trimmedName,
        description: trimmedDescription || null,
        sortOrder: parsedSortOrder,
        status: normalizeLearningAreaStatus(status),
      },
      include: {
        _count: {
          select: { modules: true },
        },
      },
    });

    res.status(201).json(formatLearningArea(created));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/learning-areas/:id
// Update an existing learning area by database ID (Admin only)
// Existing modules retain their saved historical module codes unless explicitly migrated.
// ---------------------
router.put('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learning area ID' });
    }

    const existing = await prisma.learningArea.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Learning area not found' });
    }

    const { code, name, description, status, sortOrder } = req.body;
    const data = {};

    if (code !== undefined) {
      const trimmedCode = String(code ?? '').trim();
      if (!trimmedCode) {
        return res.status(400).json({ error: 'Learning Strand Code cannot be empty.' });
      }
      if (trimmedCode.length > 50) {
        return res.status(400).json({ error: 'Learning Strand Code must be 50 characters or fewer.' });
      }
      data.code = trimmedCode;
    }

    if (name !== undefined) {
      const trimmedName = String(name ?? '').trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'Learning Strand Name cannot be empty.' });
      }
      if (trimmedName.length > 150) {
        return res.status(400).json({ error: 'Learning Strand Name must be 150 characters or fewer.' });
      }

      const otherAreas = await prisma.learningArea.findMany({
        where: { id: { not: id } },
        select: { id: true, name: true },
      });
      const duplicate = otherAreas.find(
        (a) => String(a.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return res.status(409).json({
          error: `Another learning area named "${trimmedName}" already exists.`,
        });
      }
      data.name = trimmedName;
    }

    if (description !== undefined) {
      data.description = description !== null ? String(description).trim() || null : null;
    }

    if (status !== undefined) {
      data.status = normalizeLearningAreaStatus(status);
    }

    if (sortOrder !== undefined && !isNaN(parseInt(sortOrder, 10))) {
      data.sortOrder = parseInt(sortOrder, 10);
    }

    const updated = await prisma.learningArea.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { modules: true },
        },
      },
    });

    res.json(formatLearningArea(updated));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// DELETE /api/learning-areas/:id
// Delete a learning area by database ID (Admin only)
// Prevents deleting areas referenced by existing modules.
// ---------------------
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid learning area ID' });
    }

    const existing = await prisma.learningArea.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Learning area not found' });
    }

    const moduleCount = await prisma.module.count({
      where: { learningAreaId: id },
    });
    if (moduleCount > 0) {
      return res.status(409).json({
        error: `Cannot delete this learning area because it is used by ${moduleCount} existing module(s). You can set its status to Inactive instead.`,
      });
    }

    await prisma.learningArea.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

