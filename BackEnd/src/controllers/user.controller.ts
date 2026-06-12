import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { chooseScopedBranch } from "../middleware/access";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  branchId: z.string().nullable().optional()
});

const branchStaffRoles: Role[] = [Role.BRANCH_MANAGER, Role.CHEF, Role.WAITER, Role.CASHIER];
const branchManagerRoles: Role[] = [Role.CHEF, Role.WAITER];

function isBranchStaff(role: Role) {
  return branchStaffRoles.includes(role);
}

async function canManageTargetUser(req: Request, targetUserId: string, nextRole?: Role, nextBranchId?: string | null) {
  if (!req.user) {
    return { allowed: false, message: "Missing authenticated user" };
  }
  if (req.user.id === targetUserId) {
    return { allowed: false, message: "You cannot edit or delete your own active account" };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return { allowed: false, message: "User not found" };
  }

  const requestedRole = nextRole ?? target.role;
  const requestedBranchId = nextBranchId === undefined ? target.branchId : nextBranchId;

  if (req.user.role === Role.ADMIN) {
    return { allowed: true, target };
  }

  if (req.user.role === Role.HEADQUARTER_MANAGER) {
    if (!isBranchStaff(target.role) || !isBranchStaff(requestedRole)) {
      return { allowed: false, message: "Headquarter can only manage branch staff accounts" };
    }
    if (!requestedBranchId) {
      return { allowed: false, message: "Choose a branch for this staff account" };
    }
    return { allowed: true, target };
  }

  if (req.user.role === Role.BRANCH_MANAGER) {
    if (!req.user.branchId || target.branchId !== req.user.branchId || requestedBranchId !== req.user.branchId) {
      return { allowed: false, message: "Branch managers can only manage users in their own branch" };
    }
    if (!branchManagerRoles.includes(target.role) || !branchManagerRoles.includes(requestedRole)) {
      return { allowed: false, message: "Branch managers can only manage chefs and waiters" };
    }
    return { allowed: true, target };
  }

  return { allowed: false, message: "Forbidden for this role" };
}

function getListLimit(req: Request) {
  const rawLimit = Number(req.query.limit);
  if (!Number.isFinite(rawLimit) || rawLimit <= 0) {
    return undefined;
  }
  return Math.min(Math.trunc(rawLimit), 10);
}

export async function listUsers(req: Request, res: Response) {
  const branchId = chooseScopedBranch(req);
  const users = await prisma.user.findMany({
    where: branchId ? { branchId } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true, branch: true },
    take: getListLimit(req)
  });
  if (req.query.summary === "true") {
    return res.json(users.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch?.name ?? "Global"
    })));
  }
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const parsed = userSchema.safeParse(req.body);
  if (!req.user) {
    return res.status(401).json({ message: "Missing authenticated user" });
  }
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload", issues: parsed.error.flatten() });
  }

  const userData = { ...parsed.data };
  if (req.user.role === Role.BRANCH_MANAGER) {
    if (!branchManagerRoles.includes(userData.role)) {
      return res.status(403).json({ message: "Branch managers can only create chefs and waiters" });
    }
    userData.branchId = req.user.branchId;
  }

  if (req.user.role === Role.HEADQUARTER_MANAGER) {
    if (!isBranchStaff(userData.role)) {
      return res.status(403).json({ message: "Headquarter can create branch staff only" });
    }
    if (!userData.branchId) {
      return res.status(400).json({ message: "Choose a branch for this staff account" });
    }
  }

  const { password, ...createData } = userData;
  const user = await prisma.user.create({
    data: { ...createData, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true, name: true, email: true, role: true, branchId: true, branch: true }
  });
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const id = String(req.params.id);
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload", issues: parsed.error.flatten() });
  }
  const permission = await canManageTargetUser(req, id, parsed.data.role, parsed.data.branchId);
  if (!permission.allowed) {
    return res.status(403).json({ message: permission.message });
  }
  const { password, ...rest } = parsed.data;
  const user = await prisma.user.update({
    where: { id },
    data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
    select: { id: true, name: true, email: true, role: true, branchId: true, branch: true }
  });
  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = String(req.params.id);
  const permission = await canManageTargetUser(req, id);
  if (!permission.allowed) {
    return res.status(403).json({ message: permission.message });
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.deleteMany({ where: { OR: [{ cashierId: id }, { order: { createdById: id } }] } });
    await tx.order.deleteMany({ where: { createdById: id } });
    await tx.tableBooking.deleteMany({ where: { customerId: id } });
    await tx.shift.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });
  res.status(204).send();
}
