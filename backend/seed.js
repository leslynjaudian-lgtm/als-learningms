import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    const learningCenter = await prisma.learningCenter.create({
        data: {
            name: 'Naawan Learning Center',
            locationAddress: 'Naawan, Misamis Oriental',
            municipality: 'Naawan',
            province: 'Misamis Oriental',
            status: 'active',
        },
    });

    console.log('Learning Center created:', learningCenter.name);
}

main()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });