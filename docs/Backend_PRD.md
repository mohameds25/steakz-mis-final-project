# Backend PRD - Steakz MIS

## Purpose

The backend provides a secure REST API for the Steakz worldwide restaurant-chain MIS. It centralizes operational data for branches, users, inventory, orders, sales, and shifts.

## Users

| Role | Product Need |
|---|---|
| Country Manager | View and manage all UK branch operations. |
| Branch Manager | Manage own branch inventory, sales, orders, and shifts. |
| Chef | View kitchen orders, shifts, and inventory for own branch. |
| Cashier | Create orders and sales for own branch. |
| Customer | Register, log in, place orders, and view own orders. |
| Admin | Maintain branches, users, roles, and system access. |

## Product Requirements

| ID | Requirement | Priority |
|---|---|---|
| BE-1 | Authenticate users with email/password and JWT. | Must |
| BE-2 | Enforce role-based access control. | Must |
| BE-3 | Enforce branch-level restrictions for branch users. | Must |
| BE-4 | CRUD branches for Admin/Country Manager roles. | Must |
| BE-5 | CRUD users for Admin. | Must |
| BE-6 | Manage inventory items and low-stock data. | Must |
| BE-7 | Manage orders and order status. | Must |
| BE-8 | Record sales linked to orders and cashiers. | Must |
| BE-9 | Manage staff shifts. | Should |
| BE-10 | Provide seed data for presentation. | Must |
| BE-11 | Allow public customer registration with customer-only permissions. | Must |

## Success Metrics

| Metric | Target |
|---|---|
| API coverage | Endpoints exist for all required modules. |
| Access safety | Branch users cannot access other branches. |
| Demo readiness | Seed users can test every selected role. |
