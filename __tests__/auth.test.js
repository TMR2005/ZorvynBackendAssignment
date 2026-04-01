import request from "supertest";
import app from "../index.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../middleware/auth.js";

describe("Authentication", () => {
  let adminToken;
  let userToken;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    // Create test users
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
  });

  afterAll(async () => {
    // Clean up
    await prisma.record.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("should login admin successfully", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: "admin@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("ADMIN");
    adminToken = res.body.token;
  });

  it("should login user successfully", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: "user@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("ANALYST");
    userToken = res.body.token;
  });

  it("should reject invalid credentials", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: "admin@test.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should reject inactive user", async () => {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { status: "INACTIVE" },
    });

    const res = await request(app)
      .post("/users/login")
      .send({ email: "user@test.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("User is inactive");

    // Reactivate for other tests
    await prisma.user.update({
      where: { id: testUser.id },
      data: { status: "ACTIVE" },
    });
  });

  it("should require auth for protected routes", async () => {
    const res = await request(app).get("/records");
    expect(res.status).toBe(401);
  });

  it("should allow access with valid token", async () => {
    const res = await request(app)
      .get("/records")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("should reject invalid token", async () => {
    const res = await request(app)
      .get("/records")
      .set("Authorization", "Bearer invalid");

    expect(res.status).toBe(401);
  });
});