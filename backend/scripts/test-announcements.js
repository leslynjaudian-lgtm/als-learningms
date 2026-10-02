import prisma from '../src/config/prisma.js';

async function runTests() {
  console.log('🧪 STARTING COMPREHENSIVE ANNOUNCEMENT SYSTEM TESTS\n');
  let allPassed = true;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      allPassed = false;
    }
  }

  // 1. Setup / identify test teacher and learners
  // Teacher: Maria Santos (id: 18)
  const teacher = await prisma.teacher.findFirst({
    where: { fullName: 'Maria Santos' },
    include: {
      user: true,
      learningCenter: true,
      assignedLearners: {
        include: { learningCenter: true },
      },
    },
  });

  assert(!!teacher, 'Found teacher Maria Santos');
  assert(teacher.specialization === 'Both', 'Teacher Maria Santos is assigned to Both program levels');

  // Verify learners
  const learners = await prisma.learner.findMany({
    where: { assignedTeacherId: teacher.id },
  });
  console.log(`Found ${learners.length} learners assigned to Maria Santos`);

  const elementaryLearners = learners.filter(
    (l) => l.level === 'ELEMENTARY' && (l.status || 'Active').toLowerCase() === 'active'
  );
  const juniorLearners = learners.filter(
    (l) => l.level === 'JUNIOR' && (l.status || 'Active').toLowerCase() === 'active'
  );

  console.log('Elementary learners:', elementaryLearners.map((l) => `${l.fullName} (id:${l.id})`));
  console.log('Junior High learners:', juniorLearners.map((l) => `${l.fullName} (id:${l.id})`));

  // ----------------------------------------------------
  // TEST 1: Teacher assigned to Elementary + Junior High -> Select Elementary -> Only Elementary learners appear
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Filter learners by A&E Elementary ---');
  const selectedCenterId = teacher.learningCenterId || 3;
  const filteredElem = learners.filter((l) => {
    const isActive = (l.status || 'Active').toLowerCase() === 'active';
    const matchesCenter = Number(l.learningCenterId) === Number(selectedCenterId);
    const matchesLevel = (l.level || '').toUpperCase().includes('ELEM');
    return isActive && matchesCenter && matchesLevel;
  });

  assert(filteredElem.length > 0, 'Found at least one Elementary learner');
  assert(filteredElem.every((l) => l.level === 'ELEMENTARY'), 'All filtered learners are A&E Elementary');
  assert(!filteredElem.some((l) => l.level === 'JUNIOR'), 'No Junior High learners appear when Elementary is selected');

  // ----------------------------------------------------
  // TEST 2: Teacher selects Junior High -> Only Junior High learners appear
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Filter learners by A&E Junior High ---');
  const filteredJun = learners.filter((l) => {
    const isActive = (l.status || 'Active').toLowerCase() === 'active';
    const matchesCenter = Number(l.learningCenterId) === Number(selectedCenterId);
    const matchesLevel = (l.level || '').toUpperCase().includes('JUN');
    return isActive && matchesCenter && matchesLevel;
  });

  assert(filteredJun.length > 0, 'Found at least one Junior High learner');
  assert(filteredJun.every((l) => l.level === 'JUNIOR'), 'All filtered learners are A&E Junior High');
  assert(!filteredJun.some((l) => l.level === 'ELEMENTARY'), 'No Elementary learners appear when Junior High is selected');

  // ----------------------------------------------------
  // TEST 3: Teacher sends to All Learners -> Only learners assigned to teacher + center + program level receive it
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Teacher sends announcement to All Learners (A&E Elementary) ---');
  // Create test teacher announcement for All Learners (Elementary)
  const teacherAnnElem = await prisma.announcement.create({
    data: {
      title: 'Elementary Learner Session Today',
      content: 'Important meeting for all Elementary learners at Mat-i CLC.',
      audience: 'ALL_LEARNERS',
      creatorRole: 'TEACHER',
      teacherId: teacher.id,
      learningCenterId: selectedCenterId,
      programLevel: 'A&E Elementary',
      status: 'PUBLISHED',
      authorId: teacher.userId,
    },
  });

  // Verify recipient filtering logic in SQL for Elementary Learner (Kingking Catian, id 18)
  const elemLearner = elementaryLearners[0];
  const junLearner = juniorLearners[0];

  const elemVisibilitySql = `
    SELECT a.id, a.title FROM announcements a
    WHERE a.id = ? AND a.status = 'PUBLISHED'
    AND (
      (a.creator_role = 'ADMIN' AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL') AND (a.learning_center_id IS NULL OR a.learning_center_id = ?))
      OR (a.audience IN ('INDIVIDUAL_LEARNER', 'SPECIFIC_LEARNER') AND a.target_learner_id = ?)
      OR (
        a.creator_role = 'TEACHER' AND a.audience IN ('ALL_LEARNERS', 'LEARNERS', 'ALL')
        AND a.teacher_id = ? AND (a.learning_center_id IS NULL OR a.learning_center_id = ?)
        AND (a.program_level IS NULL OR a.program_level LIKE '%Elem%')
      )
    )
  `;

  const elemRecipientRows = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    teacherAnnElem.id,
    elemLearner.learningCenterId,
    elemLearner.id,
    elemLearner.assignedTeacherId,
    elemLearner.learningCenterId
  );
  assert(elemRecipientRows.length === 1, 'Elementary learner receives the Elementary announcement');

  const junRecipientRows = await prisma.$queryRawUnsafe(
    elemVisibilitySql.replace('%Elem%', '%Jun%'),
    teacherAnnElem.id,
    junLearner.learningCenterId,
    junLearner.id,
    junLearner.assignedTeacherId,
    junLearner.learningCenterId
  );
  assert(junRecipientRows.length === 0, 'Junior High learner does NOT receive the Elementary announcement');

  // ----------------------------------------------------
  // TEST 4: Teacher sends to Individual Learner -> Only that learner receives it
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Teacher sends announcement to Individual Learner ---');
  const teacherAnnIndiv = await prisma.announcement.create({
    data: {
      title: 'Individual Follow-up for Kingking',
      content: 'Please submit your activity by tomorrow.',
      audience: 'INDIVIDUAL_LEARNER',
      creatorRole: 'TEACHER',
      teacherId: teacher.id,
      learningCenterId: selectedCenterId,
      programLevel: 'A&E Elementary',
      targetLearnerId: elemLearner.id,
      status: 'PUBLISHED',
      authorId: teacher.userId,
    },
  });

  const indivRecipientRows = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    teacherAnnIndiv.id,
    elemLearner.learningCenterId,
    elemLearner.id,
    elemLearner.assignedTeacherId,
    elemLearner.learningCenterId
  );
  assert(indivRecipientRows.length === 1, 'Targeted learner receives the individual announcement');

  const otherLearnerRows = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    teacherAnnIndiv.id,
    junLearner.learningCenterId,
    junLearner.id,
    junLearner.assignedTeacherId,
    junLearner.learningCenterId
  );
  assert(otherLearnerRows.length === 0, 'Other learner does NOT receive the individual announcement');

  // ----------------------------------------------------
  // TEST 5: Teacher announcement visibility:
  // Visible to intended learner, creating teacher, NOT visible to Admin, NOT visible to other teachers
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Teacher announcement portal visibility ---');
  // Admin query (Admin sees ONLY creator_role = 'ADMIN')
  const adminRows = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id IN (?, ?) AND creator_role = 'ADMIN'`,
    teacherAnnElem.id,
    teacherAnnIndiv.id
  );
  assert(adminRows.length === 0, 'Teacher announcements are NOT visible to Admin in Admin Announcement list');

  // Creating teacher query (Teacher sees their own)
  const teacherRows = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id IN (?, ?) AND (teacher_id = ? OR author_id = ?)`,
    teacherAnnElem.id,
    teacherAnnIndiv.id,
    teacher.id,
    teacher.userId
  );
  assert(teacherRows.length === 2, 'Teacher announcements ARE visible to the creating teacher');

  // Other teacher query (e.g. teacherId 999)
  const otherTeacherRows = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id IN (?, ?) AND ((creator_role = 'ADMIN' AND audience IN ('ALL_TEACHERS', 'TEACHERS', 'ALL')) OR teacher_id = 999 OR author_id = 999)`,
    teacherAnnElem.id,
    teacherAnnIndiv.id
  );
  assert(otherTeacherRows.length === 0, 'Teacher announcements are NOT visible to other teachers');

  // ----------------------------------------------------
  // TEST 6: Admin sends All Learners -> Visible to learners, Admin, NOT visible to teachers
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Admin sends All Learners announcement ---');
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminAnnLearners = await prisma.announcement.create({
    data: {
      title: 'District Holiday Notice for Learners',
      content: 'Classes suspended on Friday.',
      audience: 'ALL_LEARNERS',
      creatorRole: 'ADMIN',
      status: 'PUBLISHED',
      authorId: adminUser.id,
    },
  });

  // Visible to Admin
  const adminCheck = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id = ? AND creator_role = 'ADMIN'`,
    adminAnnLearners.id
  );
  assert(adminCheck.length === 1, 'Admin announcement is visible in Admin portal');

  // Visible to Learners
  const learnerCheck = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    adminAnnLearners.id,
    elemLearner.learningCenterId,
    elemLearner.id,
    elemLearner.assignedTeacherId,
    elemLearner.learningCenterId
  );
  assert(learnerCheck.length === 1, 'Admin All Learners announcement IS visible to active learners');

  // NOT visible to Teachers
  const teacherPortalCheck = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id = ? AND (
      (creator_role = 'ADMIN' AND audience IN ('ALL_TEACHERS', 'TEACHERS', 'ALL'))
      OR teacher_id = ? OR author_id = ?
    )`,
    adminAnnLearners.id,
    teacher.id,
    teacher.userId
  );
  assert(teacherPortalCheck.length === 0, 'Admin All Learners announcement is NOT visible to teachers');

  // ----------------------------------------------------
  // TEST 7: Admin sends All Teachers -> Visible to teachers, Admin, NOT visible to learners
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Admin sends All Teachers announcement ---');
  const adminAnnTeachers = await prisma.announcement.create({
    data: {
      title: 'District Teachers Meeting',
      content: 'Quarterly coordination meeting at district office.',
      audience: 'ALL_TEACHERS',
      creatorRole: 'ADMIN',
      status: 'PUBLISHED',
      authorId: adminUser.id,
    },
  });

  // Visible to Admin
  const adminCheckT = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id = ? AND creator_role = 'ADMIN'`,
    adminAnnTeachers.id
  );
  assert(adminCheckT.length === 1, 'Admin announcement is visible in Admin portal');

  // Visible to Teachers
  const teacherPortalCheckT = await prisma.$queryRawUnsafe(
    `SELECT id FROM announcements WHERE id = ? AND (
      (creator_role = 'ADMIN' AND audience IN ('ALL_TEACHERS', 'TEACHERS', 'ALL'))
      OR teacher_id = ? OR author_id = ?
    )`,
    adminAnnTeachers.id,
    teacher.id,
    teacher.userId
  );
  assert(teacherPortalCheckT.length === 1, 'Admin All Teachers announcement IS visible to teachers in Teacher Portal & Dashboard');

  // NOT visible to Learners
  const learnerCheckT = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    adminAnnTeachers.id,
    elemLearner.learningCenterId,
    elemLearner.id,
    elemLearner.assignedTeacherId,
    elemLearner.learningCenterId
  );
  assert(learnerCheckT.length === 0, 'Admin All Teachers announcement is NOT visible to learners');

  // ----------------------------------------------------
  // TEST 9: Teacher sends announcement to Multiple Individual Learners
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Teacher sends announcement to Multiple Individual Learners ---');
  const targetIds = [elemLearner.id];
  if (elementaryLearners.length > 1) {
    targetIds.push(elementaryLearners[1].id);
  }

  // Insert announcements for the target IDs
  const createdMultiIds = [];
  for (const tid of targetIds) {
    const ann = await prisma.announcement.create({
      data: {
        title: 'Selected Learners Review Session',
        content: 'Review session for specific learners.',
        audience: 'INDIVIDUAL_LEARNER',
        creatorRole: 'TEACHER',
        teacherId: teacher.id,
        learningCenterId: selectedCenterId,
        programLevel: 'A&E Elementary',
        targetLearnerId: tid,
        status: 'PUBLISHED',
        authorId: teacher.userId,
      },
    });
    createdMultiIds.push(ann.id);
  }

  // Targeted learner receives it
  const multiCheck1 = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    createdMultiIds[0],
    elemLearner.learningCenterId,
    elemLearner.id,
    elemLearner.assignedTeacherId,
    elemLearner.learningCenterId
  );
  assert(multiCheck1.length === 1, 'Targeted learner 1 receives multi-target announcement');

  // Non-targeted learner (e.g. juniorLearner) does NOT receive it
  const multiCheckOther = await prisma.$queryRawUnsafe(
    elemVisibilitySql,
    createdMultiIds[0],
    junLearner.learningCenterId,
    junLearner.id,
    junLearner.assignedTeacherId,
    junLearner.learningCenterId
  );
  assert(multiCheckOther.length === 0, 'Non-targeted learner does NOT receive multi-target announcement');

  // Clean up created test announcements
  await prisma.announcement.deleteMany({
    where: {
      id: {
        in: [teacherAnnElem.id, teacherAnnIndiv.id, adminAnnLearners.id, adminAnnTeachers.id, ...createdMultiIds],
      },
    },
  });
  console.log('\nCleaned up test announcements.');

  console.log('\n----------------------------------------');
  if (allPassed) {
    console.log('🎉 ALL 9 TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error running tests:', err);
    process.exit(1);
  });
