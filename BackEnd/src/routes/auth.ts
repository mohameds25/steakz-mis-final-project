import { Router } from "express";
import { loginUser, registerCustomer } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginUser);
authRouter.post("/register", registerCustomer);
