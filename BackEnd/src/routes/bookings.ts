import { Role } from "@prisma/client";
import { Router } from "express";
import { createBooking, deleteBooking, listBookings, updateBooking, updateBookingStatus } from "../controllers/booking.controller";
import { requireRoles } from "../middleware/access";
import { authenticate } from "../middleware/auth";

export const bookingRouter = Router();
bookingRouter.use(authenticate);

bookingRouter.get("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.ADMIN, Role.CUSTOMER), listBookings);
bookingRouter.post("/", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.ADMIN, Role.CUSTOMER), createBooking);
bookingRouter.put("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.ADMIN), updateBooking);
bookingRouter.put("/:id/status", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.ADMIN), updateBookingStatus);
bookingRouter.delete("/:id", requireRoles(Role.HEADQUARTER_MANAGER, Role.BRANCH_MANAGER, Role.WAITER, Role.ADMIN), deleteBooking);
