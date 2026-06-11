# Final Presentation Checklist

| Requirement from Brief | Status | Project File / Evidence |
|---|---|---|
| Business Process Model | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Context / Level 0 DFD | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Different forms of MIS | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Strategic, tactical, operational explanation | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Data current, valid, and accurate explanation | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Management reporting explanation | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Ethical, technical, and regulatory constraints | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| Strategic IS competitiveness evaluation | Done | `docs/Task1_Business_Process_DFD_MIS.md` |
| BPP as table | Done | `docs/Task2_BPP_ERD_Testing.md` |
| BPP references BPM and IS consequences | Done | `docs/Task2_BPP_ERD_Testing.md` |
| Review existing IS and identify improvements | Done | `docs/Task2_BPP_ERD_Testing.md` |
| Justify recommended improvements | Done | `docs/Task2_BPP_ERD_Testing.md` |
| Three levels of access evidence | Done | `docs/Task2_BPP_ERD_Testing.md`, `FrontEnd/`, `BackEnd/` |
| Critical review of developed portal | Done | `docs/Task2_BPP_ERD_Testing.md` |
| ERD | Done | `docs/Task2_BPP_ERD_Testing.md` |
| Code | Done locally | `BackEnd/`, `FrontEnd/` |
| GitHub link | Needs your URL | Add to `docs/Task2_BPP_ERD_Testing.md` |
| Deployment link | Needs your URL | Add to `docs/Task2_BPP_ERD_Testing.md` |
| Short testing methodology | Done | `docs/Task2_BPP_ERD_Testing.md` |
| Endpoint list with method and protected roles | Done | `docs/Lab_Presentation_Endpoints_ENV.md` |
| Postman saved requests | Done | `BackEnd/postman/Steakz.postman_collection.json` |
| `.env` and passwords | Done | `docs/Lab_Presentation_Endpoints_ENV.md`, `BackEnd/.env`, `FrontEnd/.env` |
| User stories for all roles | Done | `docs/User_Stories_and_Permissions.md` |
| Permission matrix | Done | `docs/User_Stories_and_Permissions.md` |
| Backend PRD/SRS | Done | `docs/Backend_PRD.md`, `docs/Backend_SRS.md` |
| Frontend PRD/SRS | Done | `docs/Frontend_PRD.md`, `docs/Frontend_SRS.md` |
| Tech stack separated by frontend/backend | Done | `README.md` |

## Demo Order

1. Open public website at `http://localhost:5174`.
2. Show Home, Book a Table, Menu, Branches, and Login tabs.
3. Register or log in as Customer and place an order.
4. Log in as London Waiter and show London orders only.
5. Log in as Manchester Chef and show Manchester orders/inventory/shifts only.
6. Log in as London Branch Manager and show own branch operations.
7. Log in as Admin and show users/roles/branches.
8. Open Prisma Studio at `http://localhost:5555`.
9. Open Postman and run `Auth - Login Admin`, `Users - Create`, and one protected list request.

## Demo Accounts

Every seeded account uses password `123456`.

| Role | Email |
|---|---|
| Admin | `admin@steakz.test` |
| System Admin | `system.admin@steakz.test` |
| Country Manager | `country@steakz.test` |
| London Branch Manager | `manager.london@steakz.test` |
| Manchester Branch Manager | `manager.manchester@steakz.test` |
| London Chef | `chef.london@steakz.test` |
| Manchester Chef | `chef.manchester@steakz.test` |
| London Waiter | `waiter.london@steakz.test` |
| Manchester Waiter | `waiter.manchester@steakz.test` |
