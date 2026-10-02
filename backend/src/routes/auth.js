import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import { signToken } from '../config/jwt.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { handleProfilePhotoUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Helper to format user response
function formatAuthResponse(user) {
  let name = user.username;
  let profile = null;

  if (user.role === 'ADMIN' && user.adminProfile) {
    name = user.adminProfile.fullName;
    profile = {
      id: user.adminProfile.id,
      fullName: user.adminProfile.fullName,
      position: user.adminProfile.position,
      district: user.adminProfile.district,
      division: user.adminProfile.division,
      contactNo: user.adminProfile.contactNo,
      profilePhoto: user.profilePhoto || null,
    };
  } else if (user.role === 'TEACHER' && user.teacherProfile) {
    name = user.teacherProfile.fullName;

    const primaryCenter = user.teacherProfile.learningCenter
      ? {
          id: user.teacherProfile.learningCenter.id,
          name: user.teacherProfile.learningCenter.name,
          code: user.teacherProfile.learningCenter.code || '',
          slug: (user.teacherProfile.learningCenter.name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          location:
            user.teacherProfile.learningCenter.locationAddress ||
            `${user.teacherProfile.learningCenter.municipality || 'Naawan'}, ${user.teacherProfile.learningCenter.province || 'Misamis Oriental'}`,
        }
      : null;

    const centers = [];
    if (primaryCenter) centers.push(primaryCenter);

    if (Array.isArray(user.teacherProfile.assignedLearners)) {
      for (const lrn of user.teacherProfile.assignedLearners) {
        if (lrn.learningCenter && !centers.some((c) => c.id === lrn.learningCenter.id)) {
          centers.push({
            id: lrn.learningCenter.id,
            name: lrn.learningCenter.name,
            code: lrn.learningCenter.code || '',
            slug: (lrn.learningCenter.name || '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
            location:
              lrn.learningCenter.locationAddress ||
              `${lrn.learningCenter.municipality || 'Naawan'}, ${lrn.learningCenter.province || 'Misamis Oriental'}`,
          });
        }
      }
    }

    profile = {
      id: user.teacherProfile.id,
      userId: user.id,
      name: user.teacherProfile.fullName,
      fullName: user.teacherProfile.fullName,
      username: user.username,
      email: user.email || '',
      position: user.teacherProfile.position,
      specialization: user.teacherProfile.specialization,
      programLevel: user.teacherProfile.specialization || 'Both',
      learningCenterId: user.teacherProfile.learningCenterId,
      learningCenter: user.teacherProfile.learningCenter?.name || '—',
      learningCenterDetails: primaryCenter,
      learningCenters: centers,
      contactNo: user.teacherProfile.contactNo,
      contactNumber: user.teacherProfile.contactNo,
      status: user.teacherProfile.status,
      profilePhoto: user.profilePhoto || null,
      assignedLearners: user.teacherProfile.assignedLearners || [],
    };
  } else if (user.role === 'LEARNER' && user.learnerProfile) {
    name = user.learnerProfile.fullName;
    let displayLevel = user.learnerProfile.level;
    if (displayLevel === 'ELEMENTARY') displayLevel = 'A&E Elementary';
    else if (displayLevel === 'JUNIOR') displayLevel = 'A&E Junior';

    profile = {
      id: user.learnerProfile.id,
      fullName: user.learnerProfile.fullName,
      lrn: user.learnerProfile.lrn,
      level: displayLevel,
      learningCenterId: user.learnerProfile.learningCenterId,
      learningCenter: user.learnerProfile.learningCenter?.name || '—',
      learningCenterDetails: user.learnerProfile.learningCenter || null,
      assignedTeacherId: user.learnerProfile.assignedTeacherId,
      assignedTeacher: user.learnerProfile.assignedTeacher?.fullName || '—',
      teacher: user.learnerProfile.assignedTeacher?.fullName || '—',
      status: user.learnerProfile.status,
      profilePhoto: user.profilePhoto || null,
    };
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    profileId: profile?.id || null,
    name,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name,
      fullName: name,
      profilePhoto: user.profilePhoto || null,
      profile,
    },
    admin: user.role === 'ADMIN' ? profile : null,
    teacher: user.role === 'TEACHER' ? profile : null,
    learner: user.role === 'LEARNER' ? profile : null,
  };
}

// ---------------------
// POST /api/auth/login
// Unified role-enforced login
// ---------------------
router.post('/login', async (req, res, next) => {
  try {
    const rawId = (
      req.body.username ||
      req.body.teacherId ||
      req.body.teacherID ||
      req.body.userName ||
      req.body.identifier ||
      ''
    ).trim();
    const rawPassword = req.body.password || req.body.passWord || '';
    const role = req.body.role ? String(req.body.role).toUpperCase().trim() : null;

    if (!rawId) {
      return res.status(400).json({ error: 'Username or identifier is required' });
    }

    const normalized = rawId.replace(/\s+/g, ' ');
    const lowerId = normalized.toLowerCase();

    // Prepare search variants (Exact, Normalized, Lowercase, Reversed "Last, First" or "Last First")
    const variants = new Set([rawId, normalized, lowerId]);

    if (normalized.includes(',')) {
      const parts = normalized.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const reversed = `${parts[1]} ${parts[0]}`.trim();
        variants.add(reversed);
        variants.add(reversed.toLowerCase());
      }
    }

    const words = normalized.split(' ');
    if (words.length === 2) {
      const reversed = `${words[1]} ${words[0]}`.trim();
      variants.add(reversed);
      variants.add(reversed.toLowerCase());
    }

    const orConditions = [];
    for (const v of variants) {
      orConditions.push({ username: v });
      orConditions.push({ email: v });
      orConditions.push({ learnerProfile: { fullName: v } });
      orConditions.push({ learnerProfile: { lrn: v } });
      orConditions.push({ teacherProfile: { fullName: v } });
      orConditions.push({ teacherProfile: { teacherIdNumber: v } });
    }

    let users = await prisma.user.findMany({
      where: { OR: orConditions },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
            assignedLearners: {
              include: {
                learningCenter: true,
              },
            },
          },
        },
        learnerProfile: {
          include: {
            learningCenter: true,
            assignedTeacher: true,
          },
        },
      },
    });

    // If no exact variant matched and role is LEARNER (or general login), try partial/fuzzy name matching
    if (users.length === 0 && (!role || role === 'LEARNER')) {
      const partialLearners = await prisma.learner.findMany({
        where: {
          OR: [
            { fullName: { contains: normalized } },
            { fullName: { contains: words[0] } },
            ...(words.length > 1 ? [{ fullName: { contains: words[words.length - 1] } }] : []),
          ],
        },
        include: {
          user: {
            include: {
              adminProfile: true,
              teacherProfile: {
                include: {
                  learningCenter: true,
                  assignedLearners: { include: { learningCenter: true } },
                },
              },
              learnerProfile: {
                include: { learningCenter: true, assignedTeacher: true },
              },
            },
          },
        },
      });

      if (partialLearners.length === 1 && partialLearners[0].user) {
        users.push(partialLearners[0].user);
      } else if (partialLearners.length > 1) {
        const allWordsMatch = partialLearners.find((l) =>
          words.every((w) => l.fullName.toLowerCase().includes(w.toLowerCase()))
        );
        if (allWordsMatch?.user) {
          users.push(allWordsMatch.user);
        } else if (partialLearners[0]?.user) {
          users.push(partialLearners[0].user);
        }
      }
    }

    let targetRole = role;
    if (role === 'ALS_TEACHER') targetRole = 'TEACHER';
    else if (role === 'ALS_LEARNER') targetRole = 'LEARNER';
    else if (role === 'ALS_ADMIN') targetRole = 'ADMIN';

    // If role was specified in request, prefer or filter by that role
    let user = users.find((u) => !targetRole || u.role === targetRole);
    if (!user && users.length > 0) {
      user = users[0];
    }

    const isTeacherAttempt =
      targetRole === 'TEACHER' ||
      user?.role === 'TEACHER' ||
      rawId.toLowerCase().startsWith('als-t');

    if (isTeacherAttempt) {
      console.log(`[Teacher Auth] Username received: ${rawId}`);
      console.log(`[Teacher Auth] User found: ${Boolean(user)}`);
      if (user) {
        console.log(`[Teacher Auth] Role: ${user.role}`);
        const isActive =
          user.status === 'ACTIVE' &&
          (!user.teacherProfile?.status || user.teacherProfile.status.toLowerCase() === 'active');
        console.log(`[Teacher Auth] Account active: ${isActive}`);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check portal role restriction if requested
    if (targetRole && user.role !== targetRole) {
      return res.status(403).json({
        error: `Access denied. Your account has the role ${user.role} and cannot log into the ${targetRole} portal.`,
      });
    }

    const isTeacherActive =
      !user.teacherProfile?.status || user.teacherProfile.status.toLowerCase() === 'active';
    if (user.status !== 'ACTIVE' || (user.role === 'TEACHER' && !isTeacherActive)) {
      return res.status(403).json({
        error: 'Your account is inactive or suspended. Please contact the ALS Administrator.',
      });
    }

    // Verify password if provided or required
    if (rawPassword && rawPassword.trim()) {
      const match = await bcrypt.compare(rawPassword.trim(), user.passwordHash);
      if (isTeacherAttempt) {
        console.log(`[Teacher Auth] Password valid: ${match}`);
      }
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    } else {
      if (isTeacherAttempt) {
        console.log(`[Teacher Auth] Password valid: false`);
      }
      // If no password provided:
      // Only allowed for LEARNER role when logging in by registered full name or LRN
      if (user.role !== 'LEARNER') {
        return res.status(400).json({ error: 'Password is required' });
      }
    }

    res.json({
      message: 'Login successful',
      ...formatAuthResponse(user),
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// GET /api/auth/me
// Verify current session
// ---------------------
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
            assignedLearners: {
              include: {
                learningCenter: true,
              },
            },
          },
        },
        learnerProfile: {
          include: {
            learningCenter: true,
            assignedTeacher: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(formatAuthResponse(user));
  } catch (err) {
    next(err);
  }
});

// ---------------------
// PUT /api/auth/profile
// Update authenticated user profile & profile photo
// ---------------------
router.put('/profile', authenticate, handleProfilePhotoUpload, async (req, res, next) => {
  try {
    const { fullName, name, email, contactNo, contact, profilePhoto, removePhoto } = req.body;
    const finalName = (fullName || name || '').trim();
    const finalContact = contactNo !== undefined ? contactNo : contact !== undefined ? contact : undefined;

    const userUpdate = {};
    if (email && email.trim()) {
      userUpdate.email = email.trim();
    }

    if (req.file) {
      userUpdate.profilePhoto = `/uploads/profile-photos/${req.file.filename}`;
    } else if (removePhoto === 'true' || removePhoto === true || profilePhoto === '') {
      userUpdate.profilePhoto = null;
    } else if (profilePhoto !== undefined) {
      userUpdate.profilePhoto = profilePhoto || null;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: userUpdate,
      });
    }

    if (req.user.role === 'ADMIN' && req.user.adminProfile) {
      const adminUpdate = {};
      if (finalName) adminUpdate.fullName = finalName;
      if (finalContact !== undefined) adminUpdate.contactNo = finalContact ? String(finalContact).trim() : null;

      if (Object.keys(adminUpdate).length > 0) {
        await prisma.admin.update({
          where: { id: req.user.adminProfile.id },
          data: adminUpdate,
        });
      }
    } else if (req.user.role === 'TEACHER' && req.user.teacherProfile) {
      const teacherUpdate = {};
      if (finalName) teacherUpdate.fullName = finalName;
      if (finalContact !== undefined) teacherUpdate.contactNo = finalContact ? String(finalContact).trim() : null;

      if (Object.keys(teacherUpdate).length > 0) {
        await prisma.teacher.update({
          where: { id: req.user.teacherProfile.id },
          data: teacherUpdate,
        });
      }
    } else if (req.user.role === 'LEARNER' && req.user.learnerProfile) {
      const learnerUpdate = {};
      if (finalName) learnerUpdate.fullName = finalName;
      if (finalContact !== undefined) learnerUpdate.contactNo = finalContact ? String(finalContact).trim() : null;

      if (Object.keys(learnerUpdate).length > 0) {
        await prisma.learner.update({
          where: { id: req.user.learnerProfile.id },
          data: learnerUpdate,
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
            assignedLearners: {
              include: {
                learningCenter: true,
              },
            },
          },
        },
        learnerProfile: {
          include: {
            learningCenter: true,
            assignedTeacher: true,
          },
        },
      },
    });

    const response = formatAuthResponse(updatedUser);
    res.json({
      message: 'Profile updated successfully',
      ...response,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------
// POST /api/auth/change-password
// Securely update current authenticated user password
// ---------------------
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password. Please try again.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword.trim(), salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
