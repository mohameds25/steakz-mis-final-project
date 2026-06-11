import { Role } from "@prisma/client";
import { Router } from "express";
import { createBranch, deleteBranch, listBranches, updateBranch } from "../controllers/branch.controller";
import { requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const branchRouter = Router();
branchRouter.use(authenticate);

branchRouter.get("/", listBranches);
branchRouter.post("/", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER), createBranch);
branchRouter.put("/:id", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER), updateBranch);
branchRouter.delete("/:id", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER), deleteBranch);
