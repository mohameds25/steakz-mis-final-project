import { Role } from "@prisma/client";
import { Router } from "express";
import { branchReport, dashboardReport, inventoryReport, lowStockReport, salesReport } from "../controllers/report.controller";
import { requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const reportRouter = Router();
reportRouter.use(authenticate);
reportRouter.use(requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER));

reportRouter.get("/dashboard", dashboardReport);
reportRouter.get("/branches", branchReport);
reportRouter.get("/sales", salesReport);
reportRouter.get("/inventory", inventoryReport);
reportRouter.get("/low-stock", lowStockReport);
