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
    if (displayLevel === 'ELEMENTARY' || displayLevel === 'A&E Elementary') displayLevel = 'A&E Elementary';
    else if (displayLevel === 'JUNIOR' || displayLevel === 'A&E Junior' || displayLevel === 'A&E Junior High' || String(displayLevel || '').toUpperCase().includes('JUN')) displayLevel = 'A&E Junior High';

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
    const role = req.body.role ? String(req.body.role).toUpperCase().trim() : null;

    let targetRole = role;
    if (role === 'ALS_TEACHER') targetRole = 'TEACHER';
    else if (role === 'ALS_LEARNER') targetRole = 'LEARNER';
    else if (role === 'ALS_ADMIN') targetRole = 'ADMIN';

    // Helper to normalize strings for comparison: trim, collapse spaces, lowercase
    const normalizeName = (str) =>
      String(str || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const rawFullName = (
      req.body.fullName ||
      req.body.name ||
      (req.body.firstName && req.body.lastName ? `${req.body.firstName} ${req.body.lastName}` : '') ||
      (targetRole === 'LEARNER' ? req.body.username : '') ||
      ''
    ).trim();

    const rawLrn = req.body.lrn ? String(req.body.lrn).trim() : null;

    // ------------------------------------------------------------------
    // LEARNER LOGIN FLOW
    // ------------------------------------------------------------------
    const isExplicitLearner =
      targetRole === 'LEARNER' ||
      req.body.fullName !== undefined ||
      (targetRole !== 'TEACHER' &&
        targetRole !== 'ADMIN' &&
        (req.body.firstName !== undefined || req.body.lastName !== undefined));

    if (isExplicitLearner) {
      if (!rawFullName) {
        return res.status(400).json({ error: 'Please enter your full name.' });
      }

      const normalizedInput = normalizeName(rawFullName);

      // Query database for all learners to compare registered First Name and Last Name combined
      const allLearners = await prisma.learner.findMany({
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
          learningCenter: true,
          assignedTeacher: true,
        },
      });

      // Strict Full Name Matching:
      // Compare registered First Name + Space + registered Last Name against entered Full Name.
      // Normalize both: trim, collapse spaces, lowercase.
      // Incomplete names (missing words from First Name or Last Name) are strictly rejected.
      const matchingLearners = allLearners.filter((l) => {
        const first = (l.firstName && l.firstName !== 'null' ? l.firstName : '').trim();
        const last = (l.lastName && l.lastName !== 'null' ? l.lastName : '').trim();
        if (!first || !last) return false;

        const registeredFullName = normalizeName(`${first} ${last}`);
        return registeredFullName === normalizedInput;
      });

      // Scenario: No matching record found
      if (matchingLearners.length === 0) {
        return res.status(401).json({
          error:
            'Unable to find your learner account. Please enter your complete registered First Name and Last Name.',
        });
      }

      // Scenario: Multiple matching records (duplicate names)
      if (matchingLearners.length > 1) {
        if (!rawLrn) {
          // Trigger LRN verification step without exposing account details
          return res.json({
            requiresLrn: true,
            message:
              'Multiple learners have the same registered name. Please enter your LRN to identify your account.',
          });
        }

        // LRN provided: strictly match LRN against the candidates
        const lrnMatched = matchingLearners.filter(
          (l) => l.lrn && String(l.lrn).trim() === rawLrn
        );

        if (lrnMatched.length !== 1) {
          return res.status(401).json({
            error:
              'Unable to verify your learner information. Please check your details or contact your ALS teacher.',
          });
        }

        const selectedLearner = lrnMatched[0];
        const user = selectedLearner.user;

        if (!user) {
          return res.status(401).json({
            error: 'Learner account not properly configured. Please contact your ALS teacher.',
          });
        }

        if (
          user.status !== 'ACTIVE' ||
          (selectedLearner.status && selectedLearner.status.toLowerCase() !== 'active')
        ) {
          return res.status(403).json({
            error: 'Your account is inactive or suspended. Please contact the ALS Administrator.',
          });
        }

        user.learnerProfile = selectedLearner;
        return res.json({
          message: 'Login successful',
          ...formatAuthResponse(user),
        });
      }

      // Scenario: Exactly one matching record
      if (rawLrn) {
        const learnerLrn = matchingLearners[0].lrn ? String(matchingLearners[0].lrn).trim() : '';
        if (!learnerLrn || learnerLrn !== rawLrn) {
          return res.status(401).json({
            error:
              'Unable to verify your learner information. Please check your details or contact your ALS teacher.',
          });
        }
      }

      const selectedLearner = matchingLearners[0];
      const user = selectedLearner.user;

      if (!user) {
        return res.status(401).json({
          error: 'Learner account not properly configured. Please contact your ALS teacher.',
        });
      }

      if (
        user.status !== 'ACTIVE' ||
        (selectedLearner.status && selectedLearner.status.toLowerCase() !== 'active')
      ) {
        return res.status(403).json({
          error: 'Your account is inactive or suspended. Please contact the ALS Administrator.',
        });
      }

      user.learnerProfile = selectedLearner;
      return res.json({
        message: 'Login successful',
        ...formatAuthResponse(user),
      });
    }

    // ------------------------------------------------------------------
    // TEACHER & ADMIN LOGIN FLOW
    // ------------------------------------------------------------------
    const rawId = (
      req.body.username ||
      req.body.teacherId ||
      req.body.teacherID ||
      req.body.userName ||
      req.body.identifier ||
      ''
    ).trim();
    const rawPassword = req.body.password || req.body.passWord || '';

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
      },
    });

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

    // Verify password for teacher/admin
    if (typeof rawPassword === 'string' && rawPassword.length > 0) {
      let match = await bcrypt.compare(rawPassword, user.passwordHash);
      if (!match && rawPassword.trim() !== rawPassword) {
        match = await bcrypt.compare(rawPassword.trim(), user.passwordHash);
      }
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    } else {
      return res.status(400).json({ error: 'Password is required' });
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

// Commonly used or compromised 12+ character passwords to reject
const COMMON_WEAK_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  '12345678901234',
  'password1234',
  'password12345',
  'password123456',
  'qwerty123456',
  'qwertyuiop12',
  'admin1234567',
  'admin12345678',
  'welcome12345',
  'letmein12345',
  'iloveyou1234',
  'changeme1234',
  'alspassword1',
  'naawandistrict',
]);

function isCompromisedOrTrivialPassword(pwd, username = '') {
  const lower = pwd.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) return true;
  // Reject passwords made of a single repeated character (e.g., "aaaaaaaaaaaa")
  if (/^(.)\1+$/.test(pwd)) return true;
  // Reject simple sequential digits
  if ('01234567890123456789'.includes(pwd) || '98765432109876543210'.includes(pwd)) return true;
  if (username && lower === String(username).toLowerCase()) return true;
  return false;
}

// ---------------------
// POST /api/auth/change-password
// Securely update current authenticated user password
// ---------------------
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    // 1. Check that all required fields are provided (do NOT trim or modify passwords)
    if (
      typeof currentPassword !== 'string' ||
      currentPassword.length === 0 ||
      typeof newPassword !== 'string' ||
      newPassword.length === 0 ||
      typeof confirmPassword !== 'string' ||
      confirmPassword.length === 0
    ) {
      return res.status(400).json({
        error: 'All password fields (current password, new password, and confirmation) are required.',
      });
    }

    // 2. Enforce minimum 12 characters and support long passphrases (up to 128 chars)
    if (newPassword.length < 12) {
      return res.status(400).json({
        error: 'New password must be at least 12 characters long.',
        field: 'newPassword',
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        error: 'New password must not exceed 128 characters.',
        field: 'newPassword',
      });
    }

    // 3. Confirm that New Password and Confirm New Password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match.',
        field: 'confirmPassword',
      });
    }

    // 4. Identify authenticated user strictly from verified JWT session
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Authenticated user account not found.' });
    }

    // 5. Verify Current Password against stored password hash
    let isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentMatch && currentPassword.trim() !== currentPassword) {
      isCurrentMatch = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
    }

    if (!isCurrentMatch) {
      return res.status(400).json({
        error: 'Incorrect current password. Please try again.',
        field: 'currentPassword',
      });
    }

    // 6. Prevent reuse of the current password
    const isSameAsCurrent =
      newPassword === currentPassword || (await bcrypt.compare(newPassword, user.passwordHash));
    if (isSameAsCurrent) {
      return res.status(400).json({
        error: 'New password cannot be the same as your current password.',
        field: 'newPassword',
      });
    }

    // 7. Reject commonly used or compromised passwords
    if (isCompromisedOrTrivialPassword(newPassword, user.username)) {
      return res.status(400).json({
        error: 'This password is too common or easily guessed. Please use a stronger password or passphrase.',
        field: 'newPassword',
      });
    }

    // 8. Securely hash the new password with bcrypt (never store or log plaintext or hash)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
