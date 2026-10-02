import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed Default Admin User if not present
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    include: { adminProfile: true },
  });

  if (!existingAdmin) {
    console.log('Creating default Admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await prisma.$transaction(async (tx) => {
      const adminUser = await tx.user.create({
        data: {
          username: 'admin',
          email: 'admin@als-naawan.edu.ph',
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      await tx.admin.create({
        data: {
          userId: adminUser.id,
          fullName: 'ALS District Coordinator',
          position: 'ALS District Coordinator',
          district: 'Naawan District',
          division: 'Misamis Oriental',
        },
      });
    });
    console.log('✅ Admin user created: username="admin", password="admin123"');
  } else {
    console.log('ℹ️ Admin user already exists:', existingAdmin.username);
  }

  // 2. Ensure Primary Learning Centers exist
  const existingCenters = await prisma.learningCenter.findMany();
  if (existingCenters.length === 0) {
    const centers = [
      {
        code: 'CLC-POB',
        name: 'Poblacion CLC',
        type: 'Community Learning Center (CLC)',
        locationAddress: 'Poblacion, Naawan',
        barangay: 'Poblacion',
        municipality: 'Naawan',
        province: 'Misamis Oriental',
        status: 'active',
      },
      {
        code: 'CLC-LIN',
        name: 'Linangkayan CLC',
        type: 'Community Learning Center (CLC)',
        locationAddress: 'Linangkayan, Naawan',
        barangay: 'Linangkayan',
        municipality: 'Naawan',
        province: 'Misamis Oriental',
        status: 'active',
      },
      {
        code: 'CLC-MAT',
        name: 'Mat-i CLC',
        type: 'Community Learning Center (CLC)',
        locationAddress: 'Mat-i, Naawan',
        barangay: 'Mat-i',
        municipality: 'Naawan',
        province: 'Misamis Oriental',
        status: 'active',
      },
    ];

    for (const c of centers) {
      await prisma.learningCenter.create({ data: c });
    }
    console.log(`✅ Seeded ${centers.length} Learning Centers`);
  } else {
    console.log(`ℹ️ Found ${existingCenters.length} existing Learning Centers`);
  }

  // 3. Ensure Learning Areas (strands) exist for ALS modules
  const existingAreas = await prisma.learningArea.findMany();
  if (existingAreas.length === 0) {
    const areas = [
      { code: 'LS1-ENG', name: 'Communication Skills (English)', sortOrder: 1 },
      { code: 'LS1-FIL', name: 'Communication Skills (Filipino)', sortOrder: 2 },
      { code: 'LS2-SCI', name: 'Scientific & Critical Thinking Skills', sortOrder: 3 },
      { code: 'LS3-MATH', name: 'Mathematical & Problem Solving Skills', sortOrder: 4 },
      { code: 'LS4-LIFE', name: 'Life and Career Skills', sortOrder: 5 },
      { code: 'LS5-SOC', name: 'Understanding Self & Society', sortOrder: 6 },
      { code: 'LS6-DIGI', name: 'Digital Citizenship', sortOrder: 7 },
    ];
    for (const a of areas) {
      await prisma.learningArea.create({ data: a });
    }
    console.log(`✅ Seeded ${areas.length} Learning Areas`);
  } else {
    console.log(`ℹ️ Found ${existingAreas.length} existing Learning Areas`);
  }

  console.log('🎉 Seed complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });