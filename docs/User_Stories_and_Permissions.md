# User Stories and Permissions

## User Stories for All Roles

| Role | User Story | Permission Boundary |
|---|---|---|
| Open Area | As a visitor, I can view the login/register screen and create a customer account. | No access to private data before authentication. |
| Country Manager | As a Country Manager, I can view all UK branch performance, orders, sales, inventory, and shifts. | Access to every UK branch, but not low-level IT account deletion unless assigned Admin. |
| Branch Manager | As a Branch Manager, I can manage orders, inventory, sales, and shifts for my own branch. | Cannot access another branch's data. |
| Chef | As a Chef, I can view my branch's kitchen orders, shifts, and inventory. | Cannot see orders or stock from another branch. |
| Waiter | As a Waiter, I can place and follow customer orders for my own branch. | Cannot see or create orders for another branch. |
| Cashier | As a Cashier, I can create orders and record sales for my own branch. | Cannot manage users, branches, or other-branch records. |
| Customer | As a Customer, I can register, log in, place an order, and view my own orders. | Cannot access staff dashboards, inventory, sales, shifts, or user management. |
| Admin | As an Admin, I can add branches, create users/admins, modify roles, and delete users. | Technical maintenance role with full user/branch control. |
| Delivery Guy | Future role: can view assigned delivery orders and update delivery status. | Not implemented in current five-role build; listed as future enhancement. |

## Permission Matrix

| Module | Open Area | Customer | Waiter | Cashier | Chef | Branch Manager | Country Manager | Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Register/Login | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Branch List | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Branch CRUD | No | No | No | No | No | No | Yes | Yes |
| User CRUD / Roles | No | No | No | No | No | No | View | Yes |
| Inventory | No | No | No | No | Own branch | Own branch | All branches | All branches |
| Orders | No | Own orders | Own branch | Own branch | Own branch | Own branch | All branches | All branches |
| Sales | No | No | No | Own branch | No | Own branch | All branches | All branches |
| Shifts | No | No | Own branch | No | Own branch | Own branch | All branches | All branches |

## Selected Roles for Current Implementation

The current implemented core roles are Country Manager, Branch Manager, Chef, Waiter, Cashier, Admin, and Customer. Delivery Guy remains a documented future feature.
