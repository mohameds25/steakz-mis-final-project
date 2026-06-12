import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { chooseScopedBranch } from "../middleware/access";

const branchSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(5),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

const managerSchema = z.object({
  managerId: z.string().min(1)
});

function branchEmailKey(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "") || `branch.${Date.now()}`;
}

function defaultStaffEmails(key: string) {
  return [`manager.${key}@steakz.test`, `chef.${key}@steakz.test`, `waiter.${key}@steakz.test`, `cashier.${key}@steakz.test`];
}

function summarizeBranch(branch: Awaited<ReturnType<typeof getBranchRecords>>[number]) {
  const manager = branch.users.find((user) => user.role === Role.BRANCH_MANAGER) || null;
  const revenue = branch.sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    address: branch.address,
    phone: branch.phone,
    status: branch.status,
    createdAt: branch.createdAt,
    manager,
    staffCount: branch.users.filter((user) => user.role !== Role.CUSTOMER).length,
    totalOrders: branch._count.orders,
    totalReservations: branch._count.bookings,
    revenue
  };
}

function getBranchRecords(where?: { id: string }) {
  return prisma.branch.findMany({
    where,
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, branchId: true },
        orderBy: [{ role: "asc" }, { name: "asc" }]
      },
      sales: { select: { amount: true } },
      _count: { select: { orders: true, bookings: true } }
    },
    orderBy: { name: "asc" }
  });
}

export async function listBranches(req: Request, res: Response) {
  const branchId = chooseScopedBranch(req);
  const branches = await getBranchRecords(branchId ? { id: branchId } : undefined);
  res.json(branches.map(summarizeBranch));
}

export async function getBranchDetails(req: Request, res: Response) {
  const id = String(req.params.id);
  const scopedBranchId = chooseScopedBranch(req);
  if (scopedBranchId && scopedBranchId !== id) {
    return res.status(403).json({ message: "Branch users can only access their own branch" });
  }

  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, branchId: true },
        orderBy: [{ role: "asc" }, { name: "asc" }]
      },
      orders: {
        include: { items: true, createdBy: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 8
      },
      bookings: {
        include: { customer: { select: { id: true, name: true, role: true } } },
        orderBy: { reservationAt: "desc" },
        take: 8
      },
      sales: {
        include: { cashier: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8
      },
      _count: { select: { orders: true, bookings: true } }
    }
  });

  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }

  const manager = branch.users.find((user) => user.role === Role.BRANCH_MANAGER) || null;
  const revenue = branch.sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  res.json({
    ...branch,
    manager,
    staffCount: branch.users.filter((user) => user.role !== Role.CUSTOMER).length,
    totalOrders: branch._count.orders,
    totalReservations: branch._count.bookings,
    revenue
  });
}

export async function createBranch(req: Request, res: Response) {
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid branch payload", issues: parsed.error.flatten() });
  }
  const passwordHash = await bcrypt.hash("123456", 10);
  const key = branchEmailKey(parsed.data.city);
  const staffEmails = defaultStaffEmails(key);
  const branch = await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({
      where: {
        branchId: null,
        email: { in: staffEmails },
        role: { in: [Role.BRANCH_MANAGER, Role.CHEF, Role.WAITER, Role.CASHIER] }
      }
    });
    const created = await tx.branch.create({ data: parsed.data });
    await tx.user.createMany({
      data: [
        { name: `${parsed.data.city} Branch Manager`, email: `manager.${key}@steakz.test`, passwordHash, role: Role.BRANCH_MANAGER, branchId: created.id },
        { name: `${parsed.data.city} Chef`, email: `chef.${key}@steakz.test`, passwordHash, role: Role.CHEF, branchId: created.id },
        { name: `${parsed.data.city} Waiter`, email: `waiter.${key}@steakz.test`, passwordHash, role: Role.WAITER, branchId: created.id },
        { name: `${parsed.data.city} Cashier`, email: `cashier.${key}@steakz.test`, passwordHash, role: Role.CASHIER, branchId: created.id }
      ],
      skipDuplicates: true
    });
    return created;
  });
  res.status(201).json(branch);
}

export async function updateBranch(req: Request, res: Response) {
  const id = String(req.params.id);
  const scopedBranchId = chooseScopedBranch(req);
  if (scopedBranchId && scopedBranchId !== id) {
    return res.status(403).json({ message: "Branch managers can only update their own branch" });
  }
  const parsed = branchSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid branch payload", issues: parsed.error.flatten() });
  }
  const branch = await prisma.branch.update({ where: { id }, data: parsed.data });
  res.json(branch);
}

export async function assignBranchManager(req: Request, res: Response) {
  const id = String(req.params.id);
  const parsed = managerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid manager assignment", issues: parsed.error.flatten() });
  }

  const manager = await prisma.user.findUnique({ where: { id: parsed.data.managerId } });
  if (!manager || manager.role !== Role.BRANCH_MANAGER) {
    return res.status(400).json({ message: "Choose a valid Branch Manager user" });
  }

  await prisma.user.updateMany({ where: { branchId: id, role: Role.BRANCH_MANAGER }, data: { branchId: null } });
  const updated = await prisma.user.update({
    where: { id: manager.id },
    data: { branchId: id },
    select: { id: true, name: true, email: true, role: true, branchId: true, branch: true }
  });
  res.json(updated);
}

export async function deleteBranch(req: Request, res: Response) {
  const id = String(req.params.id);
  const branch = await prisma.branch.findUnique({ where: { id }, select: { city: true } });
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  const branchUsers = await prisma.user.findMany({
    where: {
      OR: [
        { branchId: id },
        {
          email: { in: defaultStaffEmails(branchEmailKey(branch.city)) },
          role: { in: [Role.BRANCH_MANAGER, Role.CHEF, Role.WAITER, Role.CASHIER] }
        }
      ]
    },
    select: { id: true }
  });
  const branchUserIds = branchUsers.map((user) => user.id);

  await prisma.$transaction(async (tx) => {
    if (branchUserIds.length > 0) {
      const branchUserOrders = await tx.order.findMany({
        where: { createdById: { in: branchUserIds } },
        select: { id: true }
      });
      const branchUserOrderIds = branchUserOrders.map((order) => order.id);
      await tx.sale.deleteMany({
        where: {
          OR: [
            { cashierId: { in: branchUserIds } },
            { orderId: { in: branchUserOrderIds } }
          ]
        }
      });
      await tx.order.deleteMany({ where: { createdById: { in: branchUserIds } } });
      await tx.tableBooking.deleteMany({ where: { customerId: { in: branchUserIds } } });
      await tx.shift.deleteMany({ where: { userId: { in: branchUserIds } } });
      await tx.user.deleteMany({ where: { id: { in: branchUserIds } } });
    }
    await tx.sale.deleteMany({ where: { branchId: id } });
    await tx.order.deleteMany({ where: { branchId: id } });
    await tx.tableBooking.deleteMany({ where: { branchId: id } });
    await tx.shift.deleteMany({ where: { branchId: id } });
    await tx.inventoryItem.deleteMany({ where: { branchId: id } });
    await tx.branch.delete({ where: { id } });
  });
  res.status(204).send();
}
