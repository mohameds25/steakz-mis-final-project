# Frontend SRS - Steakz MIS

## System Overview

The frontend is a React and TypeScript web application built with Vite. It consumes the Steakz REST API.

## Functional Requirements

| ID | Function | Description |
|---|---|---|
| SRS-FE-1 | Login form | Accepts email/password and stores token after successful login. |
| SRS-FE-1A | Register form | Creates customer accounts and stores token after registration. |
| SRS-FE-2 | Role display | Shows authenticated user's role and branch context. |
| SRS-FE-3 | Metrics | Displays branches, open orders, revenue, and low-stock counts. |
| SRS-FE-4 | Inventory table | Displays stock records from API. |
| SRS-FE-5 | Orders table | Displays order queue and statuses. |
| SRS-FE-6 | Shifts table | Displays employee shift schedule. |
| SRS-FE-7 | Branches table | Displays Steakz branch list. |
| SRS-FE-8 | Sign out | Clears local session data. |
| SRS-FE-9 | Customer order form | Allows a customer to select a branch and place an order. |

## Interface Requirements

| Area | Requirement |
|---|---|
| Navigation | Sidebar links to dashboard sections. |
| Icons | Lucide icons identify major modules. |
| Responsiveness | Layout collapses to single column on small screens. |
| Errors | Failed login/API calls show a readable message. |
