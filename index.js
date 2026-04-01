import express from "express";
import dotenv from "dotenv";

import recordRoutes from "./routes/record.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

//
// MIDDLEWARE
//
app.use(express.json());

//
// HEALTH CHECK
//
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

//
// ROUTES
//
app.use("/records", recordRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/users", userRoutes);

//
// GLOBAL ERROR HANDLER
//
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err); // add this
  res.status(500).json({
    error: err.message, 
  });
});

//
// START SERVER
//
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;