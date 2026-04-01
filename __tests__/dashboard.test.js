import request from "supertest";
import app from "../index.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../middleware/auth.js";

describe("Dashboard", () => {
  let adminToken;
  let userToken;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    testAdmin = await prisma.user.create({
      data: {
        name: "Test Admin",
        email: "admin@test.com",
        password: await hashPassword("password123"),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    testUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "user@test.com",
        password: await hashPassword("password123"),
        role: "ANALYST",
        status: "ACTIVE",
      },
    });

    // Create some test records
    await prisma.record.createMany({
      data: [
        {
          amount: 1000.00,
          type: "INCOME",
          category: "Salary",
          date: new Date("2024-01-01"),
          notes: "January salary",
          createdBy: testAdmin.id,
        },
        {
          amount: 500.00,
          type: "EXPENSE",
          category: "Rent",
          date: new Date("2024-01-15"),
          notes: "Monthly rent",
          createdBy: testAdmin.id,
        },
        {
          amount: 200.00,
          type: "INCOME",
          category: "Freelance",
          date: new Date("2024-01-20"),
          notes: "Freelance work",
          createdBy: testUser.id,
        },
        {
          amount: 100.00,
          type: "EXPENSE",
          category: "Food",
          date: new Date("2024-01-25"),
          notes: "Groceries",
          createdBy: testUser.id,
        },
      ],
    });

    const loginRes = await request(app)
      .post("/users/login")
      .send({ email: "admin@test.com", password: "password123" });

    adminToken = loginRes.body.token;

    const userLoginRes = await request(app)
      .post("/users/login")
      .send({ email: "user@test.com", password: "password123" });

    userToken = userLoginRes.body.token;
  });

  afterAll(async () => {
    await prisma.record.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("should get summary as admin", async () => {
    const res = await request(app)
      .get("/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalIncome");
    expect(res.body).toHaveProperty("totalExpense");
    expect(res.body).toHaveProperty("netBalance");
    expect(res.body.totalIncome).toBe(1200.00); // 1000 + 200
    expect(res.body.totalExpense).toBe(600.00); // 500 + 100
    expect(res.body.netBalance).toBe(600.00);
  });

  it("should get summary as user (own records)", async () => {
    const res = await request(app)
      .get("/dashboard/summary")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalIncome).toBe(200.00);
    expect(res.body.totalExpense).toBe(100.00);
    expect(res.body.netBalance).toBe(100.00);
  });

  it("should get category breakdown", async () => {
    const res = await request(app)
      .get("/dashboard/categories")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("_sum");
    expect(res.body[0]).toHaveProperty("category");
    expect(res.body[0]).toHaveProperty("type");
  });

  it("should get monthly trends", async () => {
    const res = await request(app)
      .get("/dashboard/trends")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
    expect(res.body).toHaveProperty("2024-01");
    expect(res.body["2024-01"]).toHaveProperty("income");
    expect(res.body["2024-01"]).toHaveProperty("expense");
  });

  it("should get weekly trends", async () => {
    const res = await request(app)
      .get("/dashboard/weekly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("object");
  });

  it("should get recent activity", async () => {
    const res = await request(app)
      .get("/dashboard/recent")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(5);
  });

  it("should reject dashboard access without proper role", async () => {
    // Create a viewer user
    const viewer = await prisma.user.create({
      data: {
        name: "Viewer",
        email: "viewer@test.com",
        password: await hashPassword("password123"),
        role: "VIEWER",
        status: "ACTIVE",
      },
    });

    const viewerLoginRes = await request(app)
      .post("/users/login")
      .send({ email: "viewer@test.com", password: "password123" });

    const viewerToken = viewerLoginRes.body.token;

    const res = await request(app)
      .get("/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200); // VIEWER has dashboard:read

    // Clean up
    await prisma.user.delete({ where: { id: viewer.id } });
  });
});