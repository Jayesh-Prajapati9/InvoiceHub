---
name: Contacts Module Enhancement
overview: Transform the Contacts module to match Zoho Invoice design with enhanced list view, detailed customer overview page with tabs, financial tracking, contact persons, activity logs, and comprehensive address management.
todos: []
---

# Contacts/Customers Module Enhancement Plan

## Overview

Enhance the Contacts module to match Zoho Invoice's professional design with:

- Enhanced list view with financial columns and bulk actions
- Detailed customer overview page with multiple tabs
- Contact persons management
- Activity logging
- Financial tracking (Receivables, Unused Credits, Income/Expense charts)
- Separate billing and shipping addresses

## Database Schema Changes

### 1. Update Contact Model (`backend/prisma/schema.prisma`)

Add new fields to Contact model:

- `mobile` (String?) - Mobile phone number
- `customerType` (enum: BUSINESS, INDIVIDUAL) - Business or Individual customer
- `defaultCurrency` (String, default: "USD") - Default currency code
- `portalStatus` (enum: ENABLED, DISABLED, default: DISABLED) - Customer portal status
- `customerLanguage` (String, default: "en") - Preferred language
- `paymentTerms` (String?) - Payment terms (e.g., "Due on Receipt", "Net 15", "Net 30")
- Separate address fields:
- `billingAddress`, `billingCity`, `billingState`, `billingZipCode`, `billingCountry`
- `shippingAddress`, `shippingCity`, `shippingState`, `shippingZipCode`, `shippingCountry`

### 2. Create ContactPerson Model (`backend/prisma/schema.prisma`)

New model for contact persons:

- `id`, `contactId`, `name`, `email`, `phone`, `mobile`, `designation`, `isPrimary`, `createdAt`, `updatedAt`
- Relationship: Many ContactPersons belong to one Contact

### 3. Create ActivityLog Model (`backend/prisma/schema.prisma`)

New model for activity tracking:

- `id`, `contactId`, `userId`, `action`, `description`, `metadata` (JSON), `createdAt`
- Relationship: Many ActivityLogs belong to one Contact and one User

### 4. Create ContactFinancialSummary Model (Optional - for caching)

- `id`, `contactId`, `outstandingReceivables`, `unusedCredits`, `totalIncome`, `lastUpdated`
- Cache financial calculations for performance

## Backend Implementation

### 1. Database Migration

- Create migration file: `backend/prisma/migrations/XXXXX_enhance_contacts/migration.sql`
- Add new fields to Contact table
- Create ContactPerson and ActivityLog tables
- Create ContactFinancialSummary table (optional)

### 2. Update Validators (`backend/src/validators/contactValidator.ts`)

- Update `createContactSchema` and `updateContactSchema` with new fields
- Create `createContactPersonSchema` and `updateContactPersonSchema`
- Create `createActivityLogSchema`

### 3. Update Controllers

#### Contact Controller (`backend/src/controllers/contactController.ts`)

- Update `getContacts` to include financial summary calculations
- Add `getContactFinancialSummary` endpoint (calculate receivables, unused credits)
- Add `getContactIncomeExpense` endpoint (6-month chart data)
- Update `createContact` and `updateContact` to handle new fields
- Add activity log creation on contact actions

#### New ContactPerson Controller (`backend/src/controllers/contactPersonController.ts`)

- `getContactPersons` - List all contact persons for a contact
- `getContactPersonById` - Get single contact person
- `createContactPerson` - Create new contact person
- `updateContactPerson` - Update contact person
- `deleteContactPerson` - Delete contact person
- Auto-create activity log on CRUD operations

#### New ActivityLog Controller (`backend/src/controllers/activityLogController.ts`)

- `getContactActivityLogs` - Get activity logs for a contact
- `createActivityLog` - Create activity log entry

### 4. Services

#### Contact Service (`backend/src/services/contactService.ts`)

- `calculateReceivables(contactId)` - Sum of unpaid invoices (total - paidAmount)
- `calculateUnusedCredits(contactId)` - Calculate unused credits (if implemented)
- `getIncomeExpenseData(contactId, months)` - Get income/expense data for chart
- `updateFinancialSummary(contactId)` - Update cached financial summary

### 5. Routes (`backend/src/routes/contacts.ts`)

- Update existing routes
- Add `/contacts/:id/financial-summary` - GET financial summary
- Add `/contacts/:id/income-expense` - GET income/expense chart data
- Add `/contacts/:id/persons` - GET, POST contact persons
- Add `/contacts/:id/persons/:personId` - GET, PUT, DELETE contact person
- Add `/contacts/:id/activities` - GET activity logs

## Frontend Implementation

### 1. Enhanced Contacts List Page (`frontend/src/pages/Contacts/ContactsList.tsx`)

**New Features:**

- Add top banner (optional - can be dismissed)
- Enhanced search bar with keyboard shortcut indicator
- Bulk selection checkboxes
- Updated table columns:
- Checkbox column
- NAME (clickable, opens detail view)
- COMPANY NAME
- EMAIL
- WORK PHONE
- RECEIVABLES (BCY) - calculated from invoices
- UNUSED CREDITS (BCY) - placeholder for now
- Actions column
- Filter dropdown next to "Active Customers" title
- "+ New" button (already exists, enhance styling)
- More options menu (three dots)
- Make customer name clickable to navigate to detail view

**API Integration:**

- Update API call to include financial summary
- Add loading states for financial data

### 2. Customer Detail/Overview Page (`frontend/src/pages/Contacts/ContactDetail.tsx` - NEW)

**Layout Structure:**

- Left sidebar: Customer list (similar to screenshot)
- Main panel: Customer details with tabs
- Right sidebar: Financial summary and charts
- Rightmost vertical navigation bar (optional)

**Header Section:**

- Customer name as title
- Edit button
- "New Transaction" dropdown (Invoice, Quote, etc.)
- More options menu
- Close button (X)

**Tab Navigation:**

- Overview (default)
- Comments (placeholder for now)
- Transactions (list of invoices/quotes)
- Mails (placeholder for now)
- Statement (placeholder for now)

**Overview Tab Content:**

- Contact Person Card:
- Name with avatar
- Email, Phone, Mobile
- "Invite to Portal" link
- Settings icon
- Address Section:
- Billing Address (with "New Address" link if empty)
- Shipping Address (with "New Address" link if empty)
- Other Details:
- Customer Type, Default Currency, Portal Status, Customer Language
- Contact Persons Section:
- List of contact persons
- "+ Add Contact Person" button
- Activity Log:
- Timeline view of activities
- Date, action, description, user

**Right Sidebar:**

- Payment Due Period
- Receivables Section:
- Currency
- Outstanding Receivables
- Unused Credits
- Income and Expense Chart:
- Bar chart (last 6 months)
- Total Income display
- Period selector dropdown

### 3. Contact Form Updates (`frontend/src/pages/Contacts/ContactForm.tsx`)

**New Fields:**

- Mobile phone
- Customer Type (Business/Individual)
- Default Currency (dropdown)
- Portal Status (toggle)
- Customer Language (dropdown)
- Payment Terms (dropdown)
- Separate sections for Billing and Shipping addresses

### 4. Contact Person Components

#### ContactPersonForm (`frontend/src/components/Contacts/ContactPersonForm.tsx` - NEW)

- Form for creating/editing contact persons
- Fields: Name, Email, Phone, Mobile, Designation, Is Primary

#### ContactPersonsList (`frontend/src/components/Contacts/ContactPersonsList.tsx` - NEW)

- List of contact persons in overview tab
- Add/Edit/Delete functionality

### 5. Activity Log Component (`frontend/src/components/Contacts/ActivityLog.tsx` - NEW)

- Timeline view of activities
- Format: Date, Action, Description, User

### 6. Financial Summary Component (`frontend/src/components/Contacts/FinancialSummary.tsx` - NEW)

- Receivables display
- Unused Credits display
- Income/Expense chart (using a charting library like recharts)

### 7. Chart Component (`frontend/src/components/Contacts/IncomeExpenseChart.tsx` - NEW)

- Bar chart for income/expense over last 6 months
- Uses recharts library
- Responsive design

### 8. Address Management (`frontend/src/components/Contacts/AddressSection.tsx` - NEW)

- Display billing and shipping addresses
- "New Address" link opens modal/form
- Edit address functionality

## API Integration

### 1. Update API Service (`frontend/src/services/api.ts`)

- Add methods for contact persons
- Add methods for activity logs
- Add methods for financial summary
- Add methods for income/expense data

### 2. React Query Hooks

- `useContactFinancialSummary(contactId)`
- `useContactIncomeExpense(contactId, months)`
- `useContactPersons(contactId)`
- `useContactActivities(contactId)`

## UI/UX Enhancements

### 1. Styling

- Match Zoho Invoice color scheme and spacing
- Add hover effects and transitions
- Responsive design for mobile/tablet
- Loading skeletons for financial data

### 2. Navigation

- Update routing: `/contacts/:id` for detail view
- Breadcrumb navigation
- Back button functionality

### 3. Interactions

- Click customer name → navigate to detail view
- Bulk selection → show bulk actions toolbar
- Real-time updates for financial data
- Optimistic updates for contact person operations

## Implementation Order

1. **Phase 1: Database & Backend Foundation**

- Schema changes and migration
- Update Contact model and validators
- Create ContactPerson and ActivityLog models
- Update backend controllers and services

2. **Phase 2: Enhanced List View**

- Update ContactsList component
- Add financial columns
- Add bulk selection
- Make names clickable

3. **Phase 3: Detail Page - Overview Tab**

- Create ContactDetail page structure
- Implement Overview tab content
- Add right sidebar with financial summary
- Add contact persons section
- Add activity log

4. **Phase 4: Additional Tabs**

- Transactions tab (list invoices/quotes)
- Comments tab (placeholder)
- Mails tab (placeholder)
- Statement tab (placeholder)

5. **Phase 5: Financial Charts**

- Implement Income/Expense chart
- Add period selector
- Add loading states

6. **Phase 6: Polish & Testing**

- UI refinements
- Error handling
- Loading states
- Responsive design
- Testing

## Files to Create/Modify

### New Files:

- `backend/prisma/migrations/XXXXX_enhance_contacts/migration.sql`
- `backend/src/controllers/contactPersonController.ts`
- `backend/src/controllers/activityLogController.ts`
- `backend/src/services/contactService.ts`
- `frontend/src/pages/Contacts/ContactDetail.tsx`
- `frontend/src/components/Contacts/ContactPersonForm.tsx`
- `frontend/src/components/Contacts/ContactPersonsList.tsx`
- `frontend/src/components/Contacts/ActivityLog.tsx`
- `frontend/src/components/Contacts/FinancialSummary.tsx`
- `frontend/src/components/Contacts/IncomeExpenseChart.tsx`
- `frontend/src/components/Contacts/AddressSection.tsx`

### Modified Files:

- `backend/prisma/schema.prisma`
- `backend/src/validators/contactValidator.ts`
- `backend/src/controllers/contactController.ts`
- `backend/src/routes/contacts.ts`
- `frontend/src/pages/Contacts/ContactsList.tsx`
- `frontend/src/pages/Contacts/ContactForm.tsx`
- `frontend/src/App.tsx` (add new routes)
- `frontend/src/services/api.ts`

## Dependencies to Add

### Frontend:

- `recharts` - For income/expense charts
- `date-fns` - For date formatting in activity log

## Notes

- Financial calculations will be done on-demand but cached in ContactFinancialSummary table
- Activity logs will be automatically created on contact CRUD operations
- Contact persons can be marked as primary
- Portal status is a placeholder for future customer portal feature
- Comments, Mails, and Statement tabs are placeholders for future implementation
- Income/Expense chart shows data from invoices (income) - expenses can be added later if needed