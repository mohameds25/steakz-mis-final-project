import { Role } from "@prisma/client";
import { Router } from "express";
import { createSale, deleteSale, listSales } from "../controllers/sale.controller";
import { requireBranchScope, requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const saleRouter = Router();
saleRouter.use(authenticate);

saleRouter.get("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CASHIER, Role.ADMIN), listSales);
saleRouter.post("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CASHIER, Role.ADMIN), requireBranchScope, createSale);
saleRouter.delete("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.ADMIN), deleteSale);
