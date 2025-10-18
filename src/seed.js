// seed.js (optional) - run once to create admin and sample data
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('adminpassword', 10);
  const studentPass = await bcrypt.hash('studentpass', 10);
  await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: { name: 'Admin', email: 'admin@school.edu', password: adminPass, role: 'ADMIN' }
  });
  const student = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {},
    create: { name: 'Student', email: 'student@school.edu', password: studentPass, role: 'STUDENT' }
  });
  await prisma.plant.create({
    data: { name: 'Rose', scientificName: 'Rosa', startDate: new Date(), assignedToId: student.id }
  });
  console.log('Seed complete');
}
main().catch(console.error).finally(() => process.exit());
