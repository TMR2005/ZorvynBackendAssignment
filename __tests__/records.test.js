import request from "supertest";
import app from "../index.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../middleware/auth.js";

describe("Record Management", () => {
  let adminToken;
  let userToken;
  let testUser;
  let testAdmin;
  let recordId;

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

  it("should create record as admin", async () => {
    const res = await request(app)
      .post("/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 100.50,
        type: "INCOME",
        category: "Salary",
        date: "2024-01-01",
        notes: "Monthly salary",
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(100.50);
    expect(res.body.type).toBe("INCOME");
    expect(res.body.category).toBe("Salary");
    recordId = res.body.id;
  });

  it("should reject create record with invalid data", async () => {
    const res = await request(app)
      .post("/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: "invalid",
        type: "INVALID",
        category: "",
        date: "invalid-date",
      });

    expect(res.status).toBe(400);
  });

  it("should get records as admin", async () => {
    const res = await request(app)
      .get("/records")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should get records as user (own records)", async () => {
    // Create a record for the user
    await prisma.record.create({
      data: {
        amount: 50.00,
        type: "EXPENSE",
        category: "Food",
        date: new Date(),
        notes: "Lunch",
        createdBy: testUser.id,
      },
    });

    const res = await request(app)
      .get("/records")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Should only see own records
    expect(res.body.every(r => r.createdBy === testUser.id)).toBe(true);
  });

  it("should update record as admin", async () => {
    const res = await request(app)
      .patch(`/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 200.00 });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(200.00);
  });

  it("should reject update as non-admin", async () => {
    const res = await request(app)
      .patch(`/records/${recordId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 200.00 });

    expect(res.status).toBe(403);
  });

  it("should allow admin to update any record", async () => {
    const res = await request(app)
      .patch(`/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("Updated notes");
  });

  it("should delete record as admin", async () => {
    const res = await request(app)
      .delete(`/records/${recordId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Record deleted successfully");

    const deletedRecord = await prisma.record.findUnique({
      where: { id: recordId },
    });
    expect(deletedRecord.isDeleted).toBe(true);
  });

  it("should reject delete as non-admin", async () => {
    const res = await request(app)
      .delete(`/records/${recordId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should filter records by type and date", async () => {
    const res = await request(app)
      .get("/records?type=INCOME&startDate=2024-01-01&endDate=2024-12-31")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every(r => r.type === "INCOME")).toBe(true);
  });

  it("should paginate records", async () => {
    const res = await request(app)
      .get("/records?page=1&limit=1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(1);
  });
});