import { Role } from "@prisma/client";
import { Router } from "express";
import { createUser, deleteUser, listUsers, updateUser } from "../controllers/user.controller";
import { requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const userRouter = Router();
userRouter.use(authenticate);

userRouter.get("/", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER), listUsers);
userRouter.post("/", requireRoles(Role.ADMIN, Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER), createUser);
userRouter.put("/:id", requireRoles(Role.ADMIN), updateUser);
userRouter.delete("/:id", requireRoles(Role.ADMIN), deleteUser);
