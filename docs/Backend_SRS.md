# Backend SRS - Steakz MIS

## System Overview

The backend is a TypeScript Express REST API with Prisma and PostgreSQL. It provides authenticated endpoints for Steakz restaurant-chain operations.

## Functional Requirements

| ID | Function | Input | Output |
|---|---|---|---|
| SRS-BE-1 | Login | Email, password | JWT token and user profile |
| SRS-BE-1A | Customer registration | Name, email, password | Customer user and JWT token |
| SRS-BE-2 | Branch CRUD | Branch data | Branch records |
| SRS-BE-3 | User CRUD | User data, role, branch | User records without password hash |
| SRS-BE-4 | Inventory CRUD | Item, quantity, reorder level | Inventory records |
| SRS-BE-5 | Order management | Branch, table, customer, order items, quantity, total | Order records, saved item rows, and statuses |
| SRS-BE-6 | Sale management | Order, amount, payment method | Sale records |
| SRS-BE-7 | Shift management | User, branch, time range | Shift records |

## Access Requirements

| Role | Allowed Access |
|---|---|
| Country Manager | All UK branches, inventory, orders, sales, shifts, branch records. |
| Branch Manager | Own branch inventory, orders, sales, and shifts. |
| Chef | Own branch shifts, inventory, and orders only. |
| Cashier | Own branch orders and sales only. |
| Customer | Branch list, own orders, and customer order creation only. |
| Admin | Branch CRUD, user CRUD, role assignment, all system maintenance. |

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Passwords are hashed; JWT protects private routes. |
| Data Integrity | Prisma relations link orders, order items, bookings, sales, users, and branches. |
| Maintainability | Routes are split by business module. |
| Performance | List endpoints support branch scoping to reduce returned data. |
