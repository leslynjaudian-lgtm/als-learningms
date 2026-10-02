import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Checking learners table columns...');
  const cols = await prisma.$queryRawUnsafe('DESCRIBE learners');
  const colNames = cols.map(c => c.Field);
  console.log('Existing columns:', colNames);

  if (!colNames.includes('first_name')) {
    console.log('Adding first_name column...');
    await prisma.$executeRawUnsafe('ALTER TABLE learners ADD COLUMN first_name VARCHAR(100) NULL AFTER full_name');
  }

  if (!colNames.includes('middle_name')) {
    console.log('Adding middle_name column...');
    await prisma.$executeRawUnsafe('ALTER TABLE learners ADD COLUMN middle_name VARCHAR(100) NULL AFTER first_name');
  }

  if (!colNames.includes('last_name')) {
    console.log('Adding last_name column...');
    await prisma.$executeRawUnsafe('ALTER TABLE learners ADD COLUMN last_name VARCHAR(100) NULL AFTER middle_name');
  }

  console.log('Columns verified successfully.');

  // Check existing learners and populate first_name, middle_name, last_name if empty
  const learners = await prisma.learner.findMany();
  console.log(`Found ${learners.length} learners.`);

  for (const l of learners) {
    if ((!l.firstName || !l.lastName) && l.fullName) {
      const raw = l.fullName.trim();
      let f = '', m = null, last = '';
      if (raw.includes(',')) {
        // format: "Last, First Middle"
        const [lastPart, restPart] = raw.split(',').map(s => s.trim());
        last = lastPart;
        const restParts = restPart ? restPart.split(/\s+/) : [];
        f = restParts[0] || '';
        m = restParts.slice(1).join(' ') || null;
      } else {
        // format: "First Last" or "First Middle Last"
        const parts = raw.split(/\s+/);
        if (parts.length === 1) {
          f = parts[0];
          last = parts[0];
        } else if (parts.length === 2) {
          f = parts[0];
          last = parts[1];
        } else {
          f = parts[0];
          m = parts.slice(1, -1).join(' ');
          last = parts[parts.length - 1];
        }
      }
      console.log(`Updating learner id ${l.id}: first="${f}", middle="${m}", last="${last}"`);
      await prisma.learner.update({
        where: { id: l.id },
        data: {
          firstName: f,
          middleName: m,
          lastName: last,
        },
      });
    }
  }

  console.log('Migration complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
