---
name: Add Record Payment Feature for Invoices
overview: Add a "Record Payment" feature that allows users to record payments for sent/overdue invoices. This includes a Payment model to track payment history, a payment form page, and integration with the invoice detail view.
todos:
  - id: "1"
    content: Create Payment model in Prisma schema with all required fields and relations
    status: completed
  - id: "2"
    content: Create payment validator with create and update schemas
    status: completed
    dependencies:
      - "1"
  - id: "3"
    content: Create payment service with createPayment, updatePayment, getPaymentsByInvoice, and deletePayment functions
    status: completed
    dependencies:
      - "2"
  - id: "4"
    content: Create payment controller with all CRUD endpoints
    status: completed
    dependencies:
      - "3"
  - id: "5"
    content: Add payment routes and register in main router
    status: completed
    dependencies:
      - "4"
  - id: "6"
    content: Update invoice controller to include payments relation in getInvoiceById
    status: completed
    dependencies:
      - "1"
  - id: "7"
    content: Create PaymentForm component with all form fields and validation
    status: completed
    dependencies:
      - "5"
  - id: "8"
    content: Add 'Record Payment' button/dropdown to InvoiceDetail view (only for SENT/OVERDUE invoices)
    status: completed
    dependencies:
      - "7"
  - id: "9"
    content: Add payment history display section in InvoiceDetail view
    status: completed
    dependencies:
      - "6"
      - "8"
  - id: "10"
    content: Create payment API service functions in frontend
    status: completed
    dependencies:
      - "5"
---

# Add Record Payment Feature for Invoices

## Overview

Add a "Record Payment" feature that allows users to record payments for invoices that have been sent. The feature includes:

1. A "Record Payment" button/dropdown in the invoice detail view (visible only when invoice status is SENT or OVERDUE)
2. A payment form page with pre-populated fields
3. Payment history tracking via a new Payment model
4. Backend API endpoints to create and manage payments

## Database Changes

### 1. Create Payment Model

Add a new `Payment` model to track individual payment records.

**File**: `backend/prisma/schema.prisma`

```prisma
model Payment {
  id              String        @id @default(uuid())
  invoiceId       String
  invoice         Invoice       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  paymentNumber   String        @unique
  amountReceived  Decimal        @db.Decimal(10, 2)
  bankCharges     Decimal?      @db.Decimal(10, 2)
  pan             String?
  taxDeducted     Boolean       @default(false)
  tdsAmount       Decimal?      @db.Decimal(10, 2)
  paymentDate     DateTime      @default(now())
  paymentMode     String        // Cash, Bank Transfer, Cheque, Credit Card, Debit Card
  paymentReceivedOn DateTime?
  referenceNumber String?
  notes           String?
  status          PaymentStatus @default(DRAFT) // DRAFT, PAID
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum PaymentStatus {
  DRAFT
  PAID
}
```

Update `Invoice` model to include payments relation:

```prisma
model Invoice {
  // ... existing fields ...
  payments        Payment[]
}
```

## Backend Changes

### 2. Create Payment Validator

Create validation schema for payment creation and updates.

**File**: `backend/src/validators/paymentValidator.ts`

- `createPaymentSchema`: paymentNumber, invoiceId, amountReceived, bankCharges (optional), pan (optional), taxDeducted, tdsAmount (optional), paymentDate, paymentMode, paymentReceivedOn (optional), referenceNumber (optional), notes (optional), status
- `updatePaymentSchema`: same fields as create, all optional

### 3. Create Payment Service

Create business logic for payment operations.

**File**: `backend/src/services/paymentService.ts`

- `createPayment`: Create a new payment record
  - Generate payment number (format: PAY-000001, auto-increment)
  - If status is PAID, update invoice `paidAmount` and status
  - If status is DRAFT, don't update invoice
- `updatePayment`: Update payment record
  - If changing from DRAFT to PAID, update invoice
  - If changing amount, recalculate invoice paidAmount
- `getPaymentsByInvoice`: Get all payments for an invoice
- `deletePayment`: Delete payment and update invoice accordingly

### 4. Create Payment Controller

Create API endpoints for payment operations.

**File**: `backend/src/controllers/paymentController.ts`

- `POST /api/payments`: Create new payment
- `GET /api/payments/invoice/:invoiceId`: Get all payments for an invoice
- `PATCH /api/payments/:id`: Update payment
- `DELETE /api/payments/:id`: Delete payment

### 5. Add Payment Routes

Add payment routes to the router.

**File**: `backend/src/routes/payments.ts`

- Create router with all payment endpoints
- Add authentication middleware

**File**: `backend/src/index.ts` or main router file

- Register `/api/payments` route

### 6. Update Invoice Controller

Update invoice controller to include payments in invoice details.

**File**: `backend/src/controllers/invoiceController.ts`

- Update `getInvoiceById` to include `payments` relation
- Ensure payments are ordered by `paymentDate` desc

## Frontend Changes

### 7. Create Payment Form Component

Create a payment form page with all required fields.

**File**: `frontend/src/pages/Invoices/PaymentForm.tsx`

- Route: `/invoices/:invoiceId/payment`
- Form fields:
  - Customer Name (read-only, pre-filled from invoice)
  - Payment # (read-only, auto-generated)
  - Amount Received (pre-filled with balance due: `invoice.total - invoice.paidAmount`)
  - Bank Charges (optional)
  - PAN (optional, with "Add PAN" link)
  - Tax deducted? (radio: "No Tax deducted" / "Yes, TDS (Income Tax)")
  - TDS Amount (conditional, shown only if tax deducted is yes)
  - Payment Date (pre-filled with today)
  - Payment Mode (dropdown: Cash, Bank Transfer, Cheque, Credit Card, Debit Card)
  - Payment Received On (optional date field)
  - Reference# (optional)
  - Notes (textarea)
  - Attachments (file upload - can be added later, placeholder for now)
- Form actions:
  - "Save as Draft" button: Creates payment with status DRAFT
  - "Save as Paid" button: Creates payment with status PAID and updates invoice
  - "Cancel" button: Navigate back to invoice detail

### 8. Update Invoice Detail View

Add "Record Payment" button/dropdown in the action buttons area.

**File**: `frontend/src/pages/Invoices/InvoiceDetail.tsx`

- Add "Record Payment" button/dropdown (similar to "Send" dropdown)
- Show only when `invoice.status === 'SENT' || invoice.status === 'OVERDUE'`
- Dropdown options:
  - "Record Payment" (navigate to payment form)
  - "Write Off" (can be added later, placeholder)
- Add payment history section showing all payments for the invoice
- Display balance due calculation: `total - paidAmount`

### 9. Create Payment API Service

Add API functions for payment operations.

**File**: `frontend/src/services/paymentApi.ts` (or add to existing api.ts)

- `createPayment(paymentData)`: POST to `/api/payments`
- `getPaymentsByInvoice(invoiceId)`: GET `/api/payments/invoice/:invoiceId`
- `updatePayment(paymentId, paymentData)`: PATCH `/api/payments/:id`
- `deletePayment(paymentId)`: DELETE `/api/payments/:id`

## Implementation Details

### Payment Number Generation

- Format: `PAY-000001`, `PAY-000002`, etc.
- Query the last payment number, increment by 1
- Handle race conditions with database constraints

### Invoice Status Updates

- When payment is saved as PAID:
  - If `paidAmount + amountReceived >= total`: Set status to PAID
  - Otherwise: Keep status as SENT or OVERDUE
- When payment is deleted:
  - Recalculate `paidAmount` from remaining payments
  - Update status accordingly

### Payment Form Pre-population

- `amountReceived`: `invoice.total - invoice.paidAmount` (balance due)
- `paymentDate`: Current date
- `customerName`: `invoice.contact.name` (read-only)
- `paymentNumber`: Auto-generated on form load

### Validation Rules

- `amountReceived` must be > 0
- `amountReceived` should not exceed balance due (can be less for partial payments)
- `paymentDate` cannot be in the future
- `paymentMode` is required
- If `taxDeducted` is true, `tdsAmount` is required

## Migration Steps

1. Create Prisma migration: `npx prisma migrate dev --name add_payment_model`
2. Generate Prisma client: `npx prisma generate`
3. Implement backend (validators, services, controllers, routes)
4. Implement frontend (form, invoice detail updates)
5. Test payment flow: create draft payment, save as paid, verify invoice updates

## Testing Checklist

- [ ] Create payment as draft → verify invoice not updated
- [ ] Create payment as paid → verify invoice paidAmount and status updated
- [ ] Create multiple payments → verify all payments tracked
- [ ] Update payment from draft to paid → verify invoice updated
- [ ] Delete payment → verify invoice paidAmount recalculated
- [ ] Verify "Record Payment" button only shows for SENT/OVERDUE invoices
- [ ] Verify payment form pre-populates correctly
- [ ] Verify payment number auto-generation works