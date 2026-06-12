import { Role } from "@prisma/client";
import { Router } from "express";
import { assignBranchManager, createBranch, deleteBranch, getBranchDetails, listBranches, updateBranch } from "../controllers/branch.controller";
import { requireRoles } from "../middleware/access";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate } from "../middleware/auth";

export const branchRouter = Router();
branchRouter.use(authenticate);

branchRouter.get("/", asyncHandler(listBranches));
branchRouter.get("/:id/details", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER), asyncHandler(getBranchDetails));
branchRouter.post("/", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER), asyncHandler(createBranch));
branchRouter.put("/:id", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER), asyncHandler(updateBranch));
branchRouter.put("/:id/manager", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER), asyncHandler(assignBranchManager));
branchRouter.delete("/:id", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER), asyncHandler(deleteBranch));
