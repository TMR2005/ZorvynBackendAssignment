import request from "supertest";
import app from "../index.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../middleware/auth.js";

describe("User Management", () => {
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

  it("should create user as admin", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New User",
        email: "new@test.com",
        password: "password123",
        role: "VIEWER",
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("New User");
    expect(res.body.email).toBe("new@test.com");
    expect(res.body.role).toBe("VIEWER");
  });

  it("should reject create user without admin role", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Another User",
        email: "another@test.com",
        password: "password123",
        role: "VIEWER",
      });

    expect(res.status).toBe(403);
  });

  it("should get all users as admin", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should reject get users without admin role", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it("should update user as admin", async () => {
    const res = await request(app)
      .patch(`/users/${testUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated User" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated User");
  });

  it("should deactivate user as admin", async () => {
    const res = await request(app)
      .delete(`/users/${testUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deactivated successfully");

    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(updatedUser.status).toBe("INACTIVE");
  });

  it("should reject operations on non-existent user", async () => {
    const res = await request(app)
      .patch("/users/non-existent-id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test" });

    expect(res.status).toBe(404);
  });
});