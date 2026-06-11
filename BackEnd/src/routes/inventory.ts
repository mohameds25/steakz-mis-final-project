import { Role } from "@prisma/client";
import { Router } from "express";
import { createInventoryItem, deleteInventoryItem, listInventory, refillInventoryItem, updateInventoryItem, useInventoryItem } from "../controllers/inventory.controller";
import { requireBranchScope, requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

inventoryRouter.get("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.ADMIN), listInventory);
inventoryRouter.post("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.ADMIN), requireBranchScope, createInventoryItem);
inventoryRouter.put("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.ADMIN), updateInventoryItem);
inventoryRouter.put("/:id/use", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.ADMIN), useInventoryItem);
inventoryRouter.put("/:id/refill", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.ADMIN), refillInventoryItem);
inventoryRouter.delete("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.ADMIN), deleteInventoryItem);
