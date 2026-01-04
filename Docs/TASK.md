# Zoho Invoice (Partial Clone) – Task Checklist

This checklist defines the exact execution steps to build a partial clone of Zoho Invoice,
limited to the following modules:
- Invoicing
- Quotes
- Contacts
- Projects & Timesheets
- Templates
- Users & Roles
- Items

No other features are included.

---

## Phase 1: Project Foundation (Day 1)

### Setup
- [ ] Initialize backend (Node.js + TypeScript + Express)
- [ ] Initialize frontend (React + TypeScript + Vite)
- [ ] Setup PostgreSQL database
- [ ] Configure Prisma ORM
- [ ] Setup environment variables
- [ ] Configure ESLint & Prettier

### Authentication & Authorization
- [ ] JWT-based authentication
- [ ] Role-based access control (Admin, Staff)
- [ ] Middleware for protected routes

---

## Phase 2: Core Master Modules (Day 1)

### Users & Roles
- [ ] Create Role model (Admin, Staff)
- [ ] Create User model
- [ ] Assign role to user
- [ ] Restrict access based on role

### Contacts
- [ ] Create Contact CRUD APIs
- [ ] Contact types: Customer / Vendor
- [ ] Contact listing with pagination
- [ ] Frontend contact management UI

### Items
- [ ] Create Item CRUD APIs
- [ ] Fields: name, rate, unit, tax
- [ ] Reusable items across quotes & invoices
- [ ] Frontend item listing & creation

---

## Phase 3: Quotes Module (Day 2)

### Backend
- [ ] Create Quote model
- [ ] Add quote items relation
- [ ] Quote status lifecycle:
  - Draft
  - Sent
  - Accepted
  - Rejected
- [ ] Convert quote → invoice logic

### Frontend
- [ ] Quote creation form
- [ ] Item selection & calculation
- [ ] Quote status update UI
- [ ] Convert to invoice action

---

## Phase 4: Invoices Module (Day 2)

### Backend
- [ ] Create Invoice model
- [ ] Auto invoice numbering
- [ ] Tax & total calculation logic
- [ ] Invoice statuses:
  - Draft
  - Sent
  - Paid
  - Overdue

### Frontend
- [ ] Invoice list & detail pages
- [ ] Invoice preview
- [ ] Read-only sent invoices

---

## Phase 5: Projects & Timesheets (Day 3)

### Projects
- [ ] Create Project CRUD
- [ ] Assign contact to project
- [ ] Hourly rate per project

### Timesheets
- [ ] Log hours per project
- [ ] Mark billable / non-billable
- [ ] Convert billable hours to invoice items

---

## Phase 6: Templates (Day 3)

- [ ] Create Template model
- [ ] Store HTML templates
- [ ] Assign template to invoice / quote
- [ ] Render invoice using selected template

---

## Phase 7: Validation & Testing (Day 4)

- [ ] API validation using Zod
- [ ] Role-based access testing
- [ ] Edge case handling
- [ ] Manual end-to-end testing

---

## Phase 8: Documentation & Finalization (Day 4)

- [ ] Complete README.md
- [ ] Document AI usage & prompts
- [ ] Cleanup code & comments
- [ ] Prepare demo walkthrough
