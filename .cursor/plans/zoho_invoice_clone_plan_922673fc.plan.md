---
name: Zoho Invoice Clone Plan
overview: Build a partial clone of Zoho Invoice with 7 core modules (Invoicing, Quotes, Contacts, Projects & Timesheets, Templates, Users & Roles, Items) using a monorepo architecture with Express backend and Vite React frontend, Prisma ORM, and JWT authentication.
todos: []
---

# Zoho Invoice Partial Clone - Implementation Plan

## Project Structure

```
zoho-invoice/
├── backend/          # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/         # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── main.tsx
│   └── package.json
├── package.json      # Root workspace config
└── Docs/
```

## Phase 1: Foundation Setup (Day 1 - Morning)

### 1.1 Monorepo Configuration

- Setup root `package.json` with workspace configuration
- Configure TypeScript for both backend and frontend
- Setup shared scripts for development and building

### 1.2 Backend Foundation

- Initialize Express server with TypeScript
- Configure Prisma with PostgreSQL connection string
- Setup environment variables (.env files)
- Configure CORS for frontend communication
- Setup error handling middleware
- Configure request logging

**Files to create:**

- `backend/src/index.ts` - Express server entry point
- `backend/src/config/database.ts` - Prisma client initialization
- `backend/src/middleware/errorHandler.ts`
- `backend/src/middleware/auth.ts` - JWT verification
- `backend/.env.example`

### 1.3 Frontend Foundation

- Initialize Vite + React + TypeScript project
- Configure Tailwind CSS
- Setup React Router for navigation
- Configure TanStack Query for API calls
- Setup Axios or fetch wrapper for API requests
- Create layout components (Header, Sidebar, Main layout)

**Files to create:**

- `frontend/src/main.tsx` - App entry point
- `frontend/src/App.tsx` - Router setup
- `frontend/src/components/Layout/` - Layout components
- `frontend/src/services/api.ts` - API client
- `frontend/tailwind.config.js`

## Phase 2: Database Schema & Authentication (Day 1 - Afternoon)

### 2.1 Prisma Schema Design

Design complete schema with all relationships:

**Core Models:**

- `User` - Authentication and user management
- `Role` - Admin, Staff roles
- `Contact` - Customers and Vendors
- `Item` - Reusable products/services
- `Quote` - Quote documents with items
- `Invoice` - Invoice documents with items
- `Project` - Project management
- `Timesheet` - Time tracking entries
- `Template` - Invoice/Quote templates

**Key Relationships:**

- User → Role (many-to-one)
- Quote → Contact (many-to-one)
- Invoice → Contact (many-to-one)
- Quote → QuoteItem (one-to-many)
- Invoice → InvoiceItem (one-to-many)
- Project → Contact (many-to-one)
- Timesheet → Project (many-to-one)
- Invoice → Template (many-to-one)

**Files to create:**

- `backend/prisma/schema.prisma` - Complete schema

### 2.2 Authentication System

- JWT token generation and verification
- User registration and login endpoints
- Password hashing (bcrypt)
- Protected route middleware
- Role-based access control middleware

**Files to create:**

- `backend/src/routes/auth.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/middleware/rbac.ts` - Role-based access control
- `backend/src/utils/jwt.ts`

### 2.3 Frontend Auth

- Login/Register pages
- Auth context/provider
- Protected route wrapper
- Token storage and refresh logic

**Files to create:**

- `frontend/src/pages/Auth/Login.tsx`
- `frontend/src/pages/Auth/Register.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`

## Phase 3: Master Data Modules (Day 1 - Evening)

### 3.1 Users & Roles Module

**Backend:**

- User CRUD APIs (with role assignment)
- Role management APIs
- User listing with pagination
- Role-based filtering

**Files:**

- `backend/src/routes/users.ts`
- `backend/src/controllers/userController.ts`
- `backend/src/services/userService.ts`

**Frontend:**

- User management page
- Role assignment UI
- User list table with search/filter

**Files:**

- `frontend/src/pages/Users/UsersList.tsx`
- `frontend/src/pages/Users/UserForm.tsx`
- `frontend/src/components/Users/UserTable.tsx`

### 3.2 Contacts Module

**Backend:**

- Contact CRUD APIs
- Contact type (Customer/Vendor) handling
- Pagination and search
- Contact validation

**Files:**

- `backend/src/routes/contacts.ts`
- `backend/src/controllers/contactController.ts`
- `backend/src/validators/contactValidator.ts` (Zod)

**Frontend:**

- Contact list page
- Contact form (create/edit)
- Contact type selector
- Contact detail view

**Files:**

- `frontend/src/pages/Contacts/ContactsList.tsx`
- `frontend/src/pages/Contacts/ContactForm.tsx`
- `frontend/src/components/Contacts/ContactCard.tsx`

### 3.3 Items Module

**Backend:**

- Item CRUD APIs
- Item fields: name, description, rate, unit, tax rate
- Item listing with filters

**Files:**

- `backend/src/routes/items.ts`
- `backend/src/controllers/itemController.ts`
- `backend/src/validators/itemValidator.ts`

**Frontend:**

- Item list page
- Item form with tax calculation preview
- Item selection component (for quotes/invoices)

**Files:**

- `frontend/src/pages/Items/ItemsList.tsx`
- `frontend/src/pages/Items/ItemForm.tsx`
- `frontend/src/components/Items/ItemSelector.tsx`

## Phase 4: Quotes Module (Day 2 - Morning)

### 4.1 Backend Implementation

- Quote model with status lifecycle (Draft, Sent, Accepted, Rejected)
- Quote items with quantity, rate, tax
- Quote total calculation (subtotal, tax, grand total)
- Convert quote to invoice logic
- Quote status update APIs

**Files:**

- `backend/src/routes/quotes.ts`
- `backend/src/controllers/quoteController.ts`
- `backend/src/services/quoteService.ts` - Business logic
- `backend/src/validators/quoteValidator.ts`

### 4.2 Frontend Implementation

- Quote creation form with dynamic items
- Item selection from Items module
- Real-time total calculation
- Quote status management UI
- Convert to invoice button/action
- Quote preview/PDF view

**Files:**

- `frontend/src/pages/Quotes/QuotesList.tsx`
- `frontend/src/pages/Quotes/QuoteForm.tsx`
- `frontend/src/pages/Quotes/QuoteDetail.tsx`
- `frontend/src/components/Quotes/QuoteItemsTable.tsx`
- `frontend/src/components/Quotes/QuoteStatusBadge.tsx`

## Phase 5: Invoices Module (Day 2 - Afternoon)

### 5.1 Backend Implementation

- Invoice model with status (Draft, Sent, Paid, Overdue)
- Auto invoice numbering (INV-001, INV-002, etc.)
- Invoice items with calculations
- Tax and total calculation logic
- Invoice status update APIs
- Overdue calculation logic

**Files:**

- `backend/src/routes/invoices.ts`
- `backend/src/controllers/invoiceController.ts`
- `backend/src/services/invoiceService.ts`
- `backend/src/utils/invoiceNumberGenerator.ts`

### 5.2 Frontend Implementation

- Invoice list with status filters
- Invoice creation form (similar to quotes)
- Invoice detail/preview page
- Invoice status update UI
- Read-only mode for sent invoices
- Invoice template rendering

**Files:**

- `frontend/src/pages/Invoices/InvoicesList.tsx`
- `frontend/src/pages/Invoices/InvoiceForm.tsx`
- `frontend/src/pages/Invoices/InvoiceDetail.tsx`
- `frontend/src/components/Invoices/InvoicePreview.tsx`

## Phase 6: Projects & Timesheets (Day 3 - Morning)

### 6.1 Projects Module

**Backend:**

- Project CRUD APIs
- Project-contact relationship
- Hourly rate per project
- Project status tracking

**Files:**

- `backend/src/routes/projects.ts`
- `backend/src/controllers/projectController.ts`

**Frontend:**

- Project list page
- Project form with contact selection
- Project detail view

**Files:**

- `frontend/src/pages/Projects/ProjectsList.tsx`
- `frontend/src/pages/Projects/ProjectForm.tsx`

### 6.2 Timesheets Module

**Backend:**

- Timesheet CRUD APIs
- Log hours per project
- Billable/non-billable flag
- Convert billable hours to invoice items logic
- Timesheet aggregation by project

**Files:**

- `backend/src/routes/timesheets.ts`
- `backend/src/controllers/timesheetController.ts`
- `backend/src/services/timesheetService.ts` - Conversion logic

**Frontend:**

- Timesheet entry form
- Timesheet list with project filter
- Billable hours summary
- Convert to invoice items action

**Files:**

- `frontend/src/pages/Timesheets/TimesheetsList.tsx`
- `frontend/src/pages/Timesheets/TimesheetForm.tsx`
- `frontend/src/components/Timesheets/BillableHoursSummary.tsx`

## Phase 7: Templates Module (Day 3 - Afternoon)

### 7.1 Backend Implementation

- Template CRUD APIs
- Store HTML template content
- Template variables/placeholders
- Template rendering service

**Files:**

- `backend/src/routes/templates.ts`
- `backend/src/controllers/templateController.ts`
- `backend/src/services/templateService.ts` - Rendering logic

### 7.2 Frontend Implementation

- Template list page
- Template editor (HTML editor)
- Template preview
- Template selection for invoices/quotes

**Files:**

- `frontend/src/pages/Templates/TemplatesList.tsx`
- `frontend/src/pages/Templates/TemplateEditor.tsx`
- `frontend/src/components/Templates/TemplatePreview.tsx`

## Phase 8: Integration & Business Logic (Day 3 - Evening)

### 8.1 Quote to Invoice Flow

- Implement conversion logic preserving quote data
- Create invoice from accepted quote
- Link invoice to original quote
- Prevent quote modification after conversion

### 8.2 Timesheet to Invoice Flow

- Aggregate billable hours by project
- Convert hours to invoice line items
- Calculate totals based on project hourly rate

### 8.3 Template Rendering

- Replace template variables with actual data
- Generate PDF-ready HTML
- Support multiple templates

## Phase 9: Validation & Testing (Day 4 - Morning)

### 9.1 API Validation

- Complete Zod schemas for all endpoints
- Request/response validation
- Error message standardization

### 9.2 Role-Based Access Testing

- Admin vs Staff permission checks
- Protected route testing
- Unauthorized access handling

### 9.3 End-to-End Flow Testing

- User registration → Login → Create Contact → Create Item → Create Quote → Accept Quote → Convert to Invoice
- Project creation → Timesheet entry → Convert to Invoice
- Template creation → Apply to Invoice

### 9.4 Edge Cases

- Empty quote/invoice items
- Invalid status transitions
- Duplicate invoice numbers
- Negative quantities/rates

## Phase 10: UI/UX Polish & Documentation (Day 4 - Afternoon)

### 10.1 UI Improvements

- Loading states
- Error handling UI
- Success notifications
- Form validation feedback
- Responsive design checks

### 10.2 Documentation

- Update README.md with setup instructions
- Document API endpoints
- Document AI usage and prompts used
- Add inline code comments
- Create architecture diagram

### 10.3 Final Cleanup

- Remove console.logs
- Code formatting
- Remove unused imports
- Optimize bundle size

## AI/Vibe Coding Strategy

Throughout development, use AI prompts for:

1. **Schema Design**: "Design Prisma schema for Zoho Invoice clone with [specific requirements]"
2. **API Generation**: "Create Express API for [module] with validation, error handling, and role-based access"
3. **Component Generation**: "Create React form for [entity] with React Hook Form, Tailwind CSS, and real-time validation"
4. **Business Logic**: "Implement [specific feature] with [constraints]"
5. **Refactoring**: "Refactor this code to improve [aspect] while maintaining functionality"
6. **Debugging**: "Analyze this error and suggest fix"

## Key Technical Decisions

1. **Monorepo**: Use pnpm workspaces for dependency management
2. **Database**: Prisma ORM with PostgreSQL (cloud connection string)
3. **Validation**: Zod for runtime validation on both frontend and backend
4. **State Management**: TanStack Query for server state, React Context for auth
5. **Styling**: Tailwind CSS for utility-first styling
6. **Forms**: React Hook Form for form management
7. **Routing**: React Router for frontend, Express Router for backend

## Success Criteria

- All 7 modules fully functional
- End-to-end flows working (Quote→Invoice, Timesheet→Invoice)
- Role-based access control implemented
- Basic valida