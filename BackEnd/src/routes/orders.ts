import { Role } from "@prisma/client";
import { Router } from "express";
import { createOrder, deleteOrder, getOrder, listOrders, updateOrder, updateOrderStatus } from "../controllers/order.controller";
import { requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const orderRouter = Router();
orderRouter.use(authenticate);

orderRouter.get("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.WAITER, Role.CASHIER, Role.ADMIN, Role.CUSTOMER), listOrders);
orderRouter.get("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.WAITER, Role.CASHIER, Role.ADMIN, Role.CUSTOMER), getOrder);
orderRouter.post("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.CASHIER, Role.ADMIN, Role.CUSTOMER), createOrder);
orderRouter.put("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.CASHIER, Role.ADMIN), updateOrder);
orderRouter.put("/:id/status", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.CHEF, Role.WAITER, Role.CASHIER, Role.ADMIN), updateOrderStatus);
orderRouter.delete("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.ADMIN), deleteOrder);
