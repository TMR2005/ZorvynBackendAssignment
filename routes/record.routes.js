import express from "express";
import {
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
} from "../controllers/record.controller.js";

import { authorize } from "../middleware/authorize.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("record:create"), createRecord);    
router.get("/", authorize("record:read"), getRecords);          
router.patch("/:id", authorize("record:update"), updateRecord); 
router.delete("/:id", authorize("record:delete"), deleteRecord);

export default router;