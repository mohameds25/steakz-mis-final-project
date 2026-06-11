# Steakz Restaurant Chain MIS

Full-stack MIS for a UK restaurant chain. It manages public booking, customer ordering, branch-level operations, staff access, sales, shifts, users, and head-office reporting.

## Technology Stack

| Layer | Stack |
|---|---|
| Backend | TypeScript, Express, REST API, Prisma, PostgreSQL, TSX, Nodemon |
| Frontend | React, TypeScript/TSX, Vite, CSS, Lucide icons |

## Install And Run

Start PostgreSQL on port `5433`, then run:

```bash
cd "/Users/mamac/Documents/Stakez Project/BackEnd"
npm install
npm run prisma:migrate
npm run prisma:seed
npm run build
npm start
```

Open a second terminal:

```bash
cd "/Users/mamac/Documents/Stakez Project/FrontEnd"
npm install
npm run dev
```

Backend URL: `http://localhost:4000`

Frontend URL: `http://localhost:5173` or the Vite port shown in terminal.

## Demo Logins

All seeded users use password `123456`.

| Role | Email |
|---|---|
| Admin | `admin@steakz.test` |
| Country / Head Office Manager | `country@steakz.test` |
| London Branch Manager | `manager.london@steakz.test` |
| London Chef | `chef.london@steakz.test` |
| London Waiter | `waiter.london@steakz.test` |
| London Cashier | `cashier.london@steakz.test` |

Other branch accounts follow the same pattern, for example `manager.manchester@steakz.test`, `chef.birmingham@steakz.test`, and `waiter.leeds@steakz.test`.

## Role Permissions

| Role | Access |
|---|---|
| Admin | Technical/system control, users, branches, all data. |
| Country / Head Office Manager | All branches, all orders, reservations, users, sales, shifts, reports, branch add/delete, and staff creation for any branch. |
| Branch Manager | Own branch orders, bookings, sales, shifts, and staff list. Can create chefs and waiters only for own branch. |
| Chef | Own branch orders; can start orders and mark them ready. |
| Waiter | Own branch reservations and orders; can accept/cancel bookings and serve ready orders. |
| Cashier | Own branch orders and sales. |
| Customer | Register, book a table, place own order, and view own records. |

## Branch Access Rules

Branch users are filtered by `branchId`. A London manager, chef, waiter, or cashier cannot see Manchester, Birmingham, Liverpool, or Leeds operational records. Admin and Country Manager are global roles and can see all branch data.

## Dashboard Testing

1. Log in as `country@steakz.test`.
2. Confirm dashboard cards show live counts for branches, orders, reservations, revenue, users, menu items, and shifts.
3. Create an order in the Orders panel.
4. Confirm order count and revenue update after the request completes.
5. Add a branch in the Branches panel. The system also creates default manager, chef, waiter, and cashier accounts for the new branch.

## Orders And Sales Testing

1. Log in as Country Manager, Branch Manager, Waiter, or Cashier.
2. Create a walk-in order using customer name, branch, item, quantity, and status.
3. Edit the order from the Orders action list.
4. Update its status through the action buttons.
5. Delete the order and confirm it disappears.
6. Refresh the page; saved records should still be loaded from PostgreSQL.

## Reservation Testing

1. Register or log in as a customer.
2. Book a table for a selected branch.
3. Log in as that branch waiter.
4. Accept or cancel the reservation.
5. Confirm other branch waiters cannot see that booking.

## Postman Lab Demonstration

Use workspace name `Steakz MIS Lab Demonstration`.

Import these two files into Postman:

| File | Purpose |
|---|---|
| `BackEnd/postman/Steakz.postman_collection.json` | Collection name: `Steakz MIS API Endpoints` |
| `BackEnd/postman/Steakz.local.postman_environment.json` | Environment variables and saved tokens |

The collection is organised into `Auth`, `Branches`, `Users and Roles`, `Inventory`, `Orders and Sales`, `Bookings`, `Reports`, and `Role Access Tests`.

Run these first during the lab:

1. `Auth / Health Check`
2. `Auth / Login Admin`
3. `Auth / Login Branch Manager`
4. `Auth / Login Chef`
5. `Auth / Login Cashier`
6. `Auth / Register Customer`
7. `Branches / List Branches`
8. Then run any CRUD or role test request.

The login requests save tokens automatically into `adminToken`, `managerToken`, `chefToken`, `cashierToken`, and `customerToken`.

## Assignment Files

| Requirement | File |
|---|---|
| Business process model, Level 0 DFD, MIS forms | `docs/Task1_Business_Process_DFD_MIS.md` |
| BPP, ERD, code/deployment links, testing | `docs/Task2_BPP_ERD_Testing.md` |
| Lab endpoints, roles, `.env` | `docs/Lab_Presentation_Endpoints_ENV.md` |
| Final presentation checklist | `docs/Presentation_Checklist.md` |
| User stories and permission matrix | `docs/User_Stories_and_Permissions.md` |
| Backend PRD | `docs/Backend_PRD.md` |
| Frontend PRD | `docs/Frontend_PRD.md` |
| Backend SRS | `docs/Backend_SRS.md` |
| Frontend SRS | `docs/Frontend_SRS.md` |
| Postman collection | `BackEnd/postman/Steakz.postman_collection.json` |
