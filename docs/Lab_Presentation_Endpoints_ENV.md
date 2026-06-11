# Lab Presentation - Endpoints, Roles, and ENV

## Selected Roles

| Role | Scope |
|---|---|
| Country Manager | Access to every UK branch and operational report. |
| Branch Manager | Access to everything for own branch only. |
| Chef | Access to own branch shifts, inventory, and orders. |
| Waiter | Access to own branch orders and shifts. |
| Cashier | Access to own branch orders and sales. |
| Customer | Can register, log in, see branches, place orders, and view own orders only. |
| Admin | Can add branches, modify roles, delete users, create admins. |

## Endpoint List

| Method | Endpoint | Access |
|---|---|---|
| GET | `/health` | Open Area |
| POST | `/api/auth/login` | Open Area |
| POST | `/api/auth/register` | Open Area / Customer account creation |
| GET | `/api/branches` | All authenticated roles |
| POST | `/api/branches` | Admin, Country Manager |
| PUT | `/api/branches/:id` | Admin, Country Manager |
| DELETE | `/api/branches/:id` | Admin, Country Manager |
| GET | `/api/users` | Admin, Country Manager, Branch Manager own branch |
| POST | `/api/users` | Admin, Country Manager, Branch Manager own branch staff |
| PUT | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |
| GET | `/api/inventory` | Admin, Country Manager, Branch Manager, Chef |
| POST | `/api/inventory` | Admin, Country Manager, Branch Manager, Chef |
| PUT | `/api/inventory/:id` | Admin, Country Manager, Branch Manager, Chef |
| PUT | `/api/inventory/:id/use` | Admin, Country Manager, Branch Manager, Chef |
| PUT | `/api/inventory/:id/refill` | Admin, Country Manager, Branch Manager |
| DELETE | `/api/inventory/:id` | Admin, Country Manager, Branch Manager |
| GET | `/api/orders` | Admin, Country Manager, Branch Manager, Chef, Waiter, Cashier, Customer own orders |
| GET | `/api/orders/:id` | Admin, Country Manager, Branch Manager, Chef, Waiter, Cashier, Customer own order |
| POST | `/api/orders` | Admin, Country Manager, Branch Manager, Waiter, Cashier, Customer |
| PUT | `/api/orders/:id` | Admin, Country Manager, Branch Manager, Waiter, Cashier |
| PUT | `/api/orders/:id/status` | Admin, Country Manager, Branch Manager, Chef, Waiter, Cashier |
| DELETE | `/api/orders/:id` | Admin, Country Manager, Branch Manager |
| GET | `/api/bookings` | Admin, Country Manager, Branch Manager, Waiter, Customer own bookings |
| POST | `/api/bookings` | Admin, Country Manager, Branch Manager, Waiter, Customer |
| PUT | `/api/bookings/:id` | Admin, Country Manager, Branch Manager, Waiter |
| PUT | `/api/bookings/:id/status` | Admin, Country Manager, Branch Manager, Waiter |
| DELETE | `/api/bookings/:id` | Admin, Country Manager, Branch Manager, Waiter |
| GET | `/api/sales` | Admin, Country Manager, Branch Manager, Cashier |
| POST | `/api/sales` | Admin, Country Manager, Branch Manager, Cashier |
| DELETE | `/api/sales/:id` | Admin, Country Manager |
| GET | `/api/shifts` | Admin, Country Manager, Branch Manager, Chef, Waiter |
| POST | `/api/shifts` | Admin, Country Manager, Branch Manager |
| PUT | `/api/shifts/:id` | Admin, Country Manager, Branch Manager |
| GET | `/api/reports/dashboard` | Admin, Country Manager, Branch Manager own branch |
| GET | `/api/reports/branches` | Admin, Country Manager, Branch Manager own branch |
| GET | `/api/reports/sales` | Admin, Country Manager, Branch Manager own branch |
| GET | `/api/reports/inventory` | Admin, Country Manager, Branch Manager own branch |
| GET | `/api/reports/low-stock` | Admin, Country Manager, Branch Manager own branch |

Branch Manager, Chef, Waiter, and Cashier requests are restricted to their own `branchId`.

## Postman Collection

| Item | Location |
|---|---|
| Workspace name | `Steakz MIS Lab Demonstration` |
| Collection file | `BackEnd/postman/Steakz.postman_collection.json` |
| Collection name | `Steakz MIS API Endpoints` |
| Environment file | `BackEnd/postman/Steakz.local.postman_environment.json` |
| Base URL variable | `baseUrl = http://localhost:4000` |
| Token variables | `token`, `adminToken`, `managerToken`, `chefToken`, `cashierToken`, `customerToken` |
| ID variables | `branchId`, `londonBranchId`, `manchesterBranchId`, `userId`, `inventoryId`, `orderId`, `otherBranchOrderId`, `bookingId`, `saleId`, `shiftId` |

Postman includes more than 25 saved requests for all implemented endpoints: login, customer registration, branch CRUD, user CRUD, inventory CRUD/use/refill, order list/single/create/edit/status/delete, booking CRUD/status, sales list/create/delete, report endpoints, and role access tests.

When an order is created with menu items, the backend saves each dish as an `OrderItem`, deducts the matching ingredient stock from that branch inventory, and records the order value as a paid sale. A reservation is not counted as sales revenue until an order is placed.

The collection folders are:

| Folder | Demonstrates |
|---|---|
| Auth | Open area health check, role logins, customer registration, saved tokens |
| Branches | Branch CRUD |
| Users and Roles | Admin/user management and role assignment |
| Inventory | Stock list, create, update, use stock, add stock, delete |
| Orders and Sales | Order CRUD, order status, saved order items, sales |
| Bookings | Reservation CRUD and waiter/manager confirmation |
| Reports | Dashboard, branch, sales, inventory, and low-stock reports |
| Role Access Tests | 401/403 and branch isolation evidence |

The collection also includes a folder called `Role Access Tests`, which is useful for the lab presentation:

| Role Test Group | Included GET Tests |
|---|---|
| Admin | Admin can access all orders. |
| Branch Manager | London manager can access own orders and is blocked from another branch order. |
| Chef | London chef can access own inventory and is blocked from creating stock for Manchester. |
| Cashier | London cashier can access own sales. |
| Customer | Customer can access own orders and is blocked from users list. |

## Request Body Examples

| Request | Body Example | Expected Result |
|---|---|---|
| Register Customer | `{ "name": "Postman Lab Customer", "email": "postman.lab.customer@steakz.test", "password": "123456" }` | `201 Created`, customer token saved |
| Create Inventory Item | `{ "branchId": "{{londonBranchId}}", "name": "Ribeye Steak Stock", "category": "Meat", "quantity": 25, "unit": "portions", "reorderLevel": 10, "supplier": "London Prime Butchers" }` | `201 Created`, `inventoryId` saved |
| Create Walk-in Order | `{ "branchId": "{{londonBranchId}}", "customerName": "Walk-in Customer - 2x Signature Ribeye", "total": 96, "items": [{ "name": "Signature Ribeye", "quantity": 2, "unitPrice": 48 }] }` | `201 Created`, order and sale saved |
| Update Order Status | `{ "status": "PREPARING" }` | `200 OK`, order status changed |
| Update Booking Status | `{ "status": "CONFIRMED" }` | `200 OK`, reservation confirmed |

## Postman Test Evidence

| Test | Result |
|---|---|
| Health check | `GET /health` returned `200 OK`. |
| Admin login | `POST /api/auth/login` returned `200 OK` and a JWT token. |
| Customer registration | `POST /api/auth/register` returned `201 Created`. |
| Customer booking | `POST /api/bookings` returned `201 Created`. |
| Customer order | `POST /api/orders` returned `201 Created`. |
| Customer blocked from inventory | `GET /api/inventory` returned `403 Forbidden`, which proves role security. |
| Branch isolation | London Manager only saw London orders; Manchester Manager only saw Manchester orders. |

## ENV File for Lab

Backend `.env`:

```env
DATABASE_URL="postgresql://steakz_user:steakz_password@localhost:5433/steakz_db?schema=public"
JWT_SECRET="steakz_lab_secret_change_before_real_deployment"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:4000
```

Demo password for seeded users: `123456`

Full-access admin users:

```text
admin@steakz.test
system.admin@steakz.test
```

## Interface Screenshots to Prepare

| Screenshot | Purpose |
|---|---|
| Public Home tab | Shows guest-facing worldwide Steakz website. |
| Book a Table tab | Shows customer reservation flow. |
| Menu tab | Shows menu UI. |
| Branches tab | Shows worldwide branches. |
| Login/Register tab | Shows open-area account access. |
| Customer dashboard | Shows menu, order creation, own orders, and branches only. |
| Admin dashboard | Shows branch/user/system control permissions. |
| Branch Manager dashboard | Shows own-branch operations. |
| Chef dashboard | Shows own-branch kitchen orders/inventory/shifts. |
| Cashier dashboard | Shows own-branch orders and sales. |
| Prisma Studio | Shows database models and persisted records. |
| Postman successful request | Shows token/user creation/API testing evidence. |
