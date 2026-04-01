import prisma from '../lib/prisma.js'

async function main() {
  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@test.com",
      password: "admin123",
      role: "ADMIN",
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: "Analyst User",
      email: "analyst@test.com",
      password: "analyst123",
      role: "ANALYST",
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: "Viewer User",
      email: "viewer@test.com",
      password: "viewer123",
      role: "VIEWER",
    },
  });

  // Create Records
  await prisma.record.createMany({
    data: [
      {
        amount: 50000,
        type: "INCOME",
        category: "salary",
        date: new Date("2026-01-01"),
        createdBy: admin.id,
      },
      {
        amount: 10000,
        type: "EXPENSE",
        category: "rent",
        date: new Date("2026-01-05"),
        createdBy: admin.id,
      },
      {
        amount: 5000,
        type: "EXPENSE",
        category: "food",
        date: new Date("2026-01-10"),
        createdBy: admin.id,
      },
      {
        amount: 20000,
        type: "INCOME",
        category: "freelance",
        date: new Date("2026-02-01"),
        createdBy: analyst.id,
      },
      {
        amount: 7000,
        type: "EXPENSE",
        category: "travel",
        date: new Date("2026-02-15"),
        createdBy: analyst.id,
      },
    ],
  });

  console.log("🌱 Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });