---
name: Add Project Association and Payment Terms
overview: Add project association and payment terms (Net 15, Net 30, etc.) to both Quotes and Invoices. Payment terms will auto-calculate expiry/due dates, and manual date changes will auto-select "Custom".
todos:
  - id: "1"
    content: "Update Prisma schema: Add projectId and paymentTerms to Quote and Invoice models, add relations"
    status: completed
  - id: "2"
    content: Create and run Prisma migration for schema changes
    status: completed
    dependencies:
      - "1"
  - id: "3"
    content: Update quote and invoice validators to include projectId and paymentTerms fields
    status: completed
    dependencies:
      - "2"
  - id: "4"
    content: Update quoteService to handle projectId and paymentTerms, implement date calculation logic
    status: completed
    dependencies:
      - "3"
  - id: "5"
    content: Update invoiceService to handle projectId and paymentTerms, implement date calculation logic
    status: completed
    dependencies:
      - "3"
  - id: "6"
    content: Update quoteController to include project relation in queries and handle new fields
    status: completed
    dependencies:
      - "4"
  - id: "7"
    content: Update invoiceController to include project relation in queries and handle new fields
    status: completed
    dependencies:
      - "5"
  - id: "8"
    content: "Update QuoteForm: Add project dropdown, payment terms dropdown, and auto-calculation logic"
    status: completed
    dependencies:
      - "6"
  - id: "9"
    content: "Update InvoiceForm: Add project dropdown, payment terms dropdown, and auto-calculation logic"
    status: completed
    dependencies:
      - "7"
  - id: "10"
    content: Update QuoteDetail to display project and payment terms
    status: completed
    dependencies:
      - "8"
  - id: "11"
    content: Update InvoiceDetail to display project and payment terms
    status: completed
    dependencies:
      - "9"
---

# Add Project Association and Payment Terms to Quotes and Invoices

## Overview

This plan adds two features to both Quotes and Invoices:

1. **Project Association**: Add a project dropdown field to associate quotes/invoices with projects
2. **Payment Terms**: Add payment terms dropdown (Net 15, Net 30, Net 45, Net 60, Due on Receipt, Custom) that auto-calculates expiry/due dates. Manual date changes auto-select "Custom".

## Database Changes

### 1. Update Prisma Schema

- Add `projectId` field (optional, nullable) to `Quote` and `Invoice` models
- Add `paymentTerms` field (optional, nullable) to `Quote` and `Invoice` models
- Add relations: `Quote.project` → `Project` and `Invoice.project` → `Project`
- Update `Project` model to include `quotes` and `invoices` relations

**File**: `backend/prisma/schema.prisma`

## Backend Changes

### 2. Update Validators

- Add `projectId` (optional UUID) and `paymentTerms` (optional string) to quote and invoice schemas
- Payment terms should accept: 'Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'

**Files**:

- `backend/src/validators/quoteValidator.ts`
- `backend/src/validators/invoiceValidator.ts`

### 3. Update Services

- Update `createQuote` and `updateQuote` in `quoteService.ts` to handle `projectId` and `paymentTerms`
- Update `createInvoice` and `updateInvoice` in `invoiceService.ts` to handle `projectId` and `paymentTerms`
- When `paymentTerms` is provided (not "Custom"), calculate `expiryDate`/`dueDate` from `issueDate` + days
- When `paymentTerms` is "Custom" or not provided, use the provided date directly

**Files**:

- `backend/src/services/quoteService.ts`
- `backend/src/services/invoiceService.ts`

### 4. Update Controllers

- Update `getQuoteById` and `getInvoiceById` to include `project` relation
- Ensure `createQuoteController` and `createInvoiceController` pass `projectId` and `paymentTerms`
- Ensure `updateQuote` and `updateInvoice` handle `projectId` and `paymentTerms`

**Files**:

- `backend/src/controllers/quoteController.ts`
- `backend/src/controllers/invoiceController.ts`

## Frontend Changes

### 5. Update Quote Form

- Add project dropdown field (fetch projects via API)
- Add payment terms dropdown with options: 'Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Custom'
- Add logic to auto-calculate `expiryDate` when payment terms change (based on `issueDate`)
- Add logic to auto-select "Custom" when user manually changes `expiryDate`
- Watch `issueDate` changes and recalculate if payment terms is not "Custom"

**File**: `frontend/src/pages/Quotes/QuoteForm.tsx`

### 6. Update Invoice Form

- Same changes as Quote Form (project dropdown, payment terms dropdown, auto-calculation logic)
- Use `dueDate` instead of `expiryDate` for invoices

**File**: `frontend/src/pages/Invoices/InvoiceForm.tsx`

### 7. Update Quote Detail View

- Display associated project if exists
- Display payment terms if exists

**File**: `frontend/src/pages/Quotes/QuoteDetail.tsx`

### 8. Update Invoice Detail View

- Display associated project if exists
- Display payment terms if exists

**File**: `frontend/src/pages/Invoices/InvoiceDetail.tsx`

## Implementation Details

### Payment Terms Calculation Logic

- **Due on Receipt**: `dueDate = issueDate` (same day)
- **Net 15**: `dueDate = issueDate + 15 days`
- **Net 30**: `dueDate = issueDate + 30 days`
- **Net 45**: `dueDate = issueDate + 45 days`
- **Net 60**: `dueDate = issueDate + 60 days`
- **Custom**: Use manually entered date, no auto-calculation

### Auto-Selection Logic

- When user manually changes `expiryDate`/`dueDate` via date picker:
- Check if the new date matches any calculated date from payment terms
- If no match, set `paymentTerms` to "Custom"
- If match found, keep the matching payment term

### Date Recalculation

- When `issueDate` changes and `paymentTerms` is not "Custom":
- Recalculate `expiryDate`/`dueDate` based on new `issueDate` + payment terms days
- When `paymentTerms` changes:
- If not "Custom", calculate new date
- If "Custom", don't change the date (let user set it manually)

## Migration Steps

1. Create Prisma migration: `npx prisma migrate dev --name add_project_and_payment_terms_to_quotes_invoices`
2. Generate Prisma client: `npx prisma generate`
3. Update backend code (validators, services, controllers)
4. Update frontend code (forms, detail views)
5. Test the flow: create/edit quotes and invoices with projects and payment terms

## Testing Checklist

- [ ] Create quote with project and payment terms (Net 15) → verify expiry date is issueDate + 15 days
- [ ] Edit quote and change payment terms to Net 30 → verify expiry date updates
- [ ] Manually change expiry date → verify payment terms changes to "Custom"
- [ ] Change issue date with payment terms set → verify expiry date recalculates
- [ ] Same tests for invoices (using dueDate instead of expiryDate)
- [ ] Verify project association is saved and displayed correctly