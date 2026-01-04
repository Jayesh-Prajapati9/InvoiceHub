# Zoho Invoice Clone - Modules Documentation

This document provides a comprehensive explanation of all modules implemented in the Zoho Invoice clone, detailing their functionality, features, and how they work together.

---

## Table of Contents

1. [Users & Roles Module](#1-users--roles-module)
2. [Contacts Module](#2-contacts-module)
3. [Items Module](#3-items-module)
4. [Quotes Module](#4-quotes-module)
5. [Invoices Module](#5-invoices-module)
6. [Projects & Timesheets Module](#6-projects--timesheets-module)
7. [Templates Module](#7-templates-module)

---

## 1. Users & Roles Module

### Overview
The Users & Roles module manages user accounts and access control within the system. It implements role-based access control (RBAC) to ensure proper security and permissions.

### Features

#### User Management
- **User Registration**: New users can register with email and password
- **User Authentication**: JWT-based login system
- **User Profile**: Stores user name, email, and role assignment
- **User Listing**: View all users with pagination
- **User Updates**: Edit user information (Admin only)
- **User Deletion**: Remove users from the system (Admin only)

#### Role Management
- **Role Types**: 
  - `ADMIN`: Full system access, can manage users and all modules
  - `STAFF`: Limited access, can manage business data but not users
- **Role Assignment**: Users are assigned roles during registration (default: STAFF)
- **Role-based Access**: Different permissions based on user role
- **Initial Admin Setup**: Run `pnpm backend:prisma:seed` to create default admin user (see SETUP.md)

### How It Works

1. **Registration Flow**:
   - User provides name, email, and password
   - Password is hashed using bcrypt
   - User is assigned default STAFF role
   - JWT token is generated and returned
   - User data is stored in database
   - **Note**: To create an ADMIN user, either:
     - Run the seed script: `pnpm backend:prisma:seed` (creates default admin)
     - Have an existing admin create a new user with ADMIN role via Users & Roles page

2. **Authentication Flow**:
   - User provides email and password
   - System verifies credentials
   - JWT token is generated with user ID, email, and role
   - Token is stored in localStorage for subsequent requests

3. **Authorization Flow**:
   - Protected routes check for valid JWT token
   - Role-based middleware restricts access based on user role
   - Admin-only routes require ADMIN role

### Database Schema
- **User Model**: id, name, email, password (hashed), roleId, timestamps
- **Role Model**: id, name (ADMIN/STAFF), timestamps
- **Relationship**: User belongs to Role (many-to-one)

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user details (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/roles` - Get all available roles

---

## 2. Contacts Module

### Overview
The Contacts module manages customer and vendor information. Contacts are essential entities that are referenced in quotes, invoices, and projects.

### Features

#### Contact Types
- **Customer**: Clients who receive quotes and invoices
- **Vendor**: Suppliers or service providers

#### Contact Information
- **Basic Details**: Name, email, phone, company
- **Address Information**: Street, city, state, ZIP code, country
- **Contact Management**: Create, read, update, delete operations
- **Search & Filter**: Search by name, email, company; filter by type

### How It Works

1. **Contact Creation**:
   - User provides contact details
   - Contact type (Customer/Vendor) is selected
   - Contact is saved to database
   - Contact becomes available for use in quotes/invoices

2. **Contact Usage**:
   - Contacts are linked to Quotes (one contact per quote)
   - Contacts are linked to Invoices (one contact per invoice)
   - Contacts are linked to Projects (one contact per project)
   - Changes to contact information reflect across all related documents

3. **Contact Search**:
   - Full-text search across name, email, and company fields
   - Filter by contact type (Customer/Vendor)
   - Paginated results for large datasets

### Database Schema
- **Contact Model**: id, name, email, phone, company, address fields, type (CUSTOMER/VENDOR), timestamps
- **Relationships**: 
  - One-to-many with Quotes
  - One-to-many with Invoices
  - One-to-many with Projects

### API Endpoints
- `GET /api/contacts` - List contacts (with search and filter)
- `GET /api/contacts/:id` - Get contact details
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Business Flow
```
Create Contact → Use in Quote/Invoice/Project → Track all interactions
```

---

## 3. Items Module

### Overview
The Items module manages reusable products and services that can be added to quotes and invoices. Items standardize pricing and reduce data entry errors.

### Features

#### Item Properties
- **Name**: Product or service name
- **Description**: Detailed description (optional)
- **Rate**: Base price per unit
- **Unit**: Measurement unit (e.g., hour, day, piece, unit)
- **Tax Rate**: Percentage tax applicable to the item

#### Item Management
- **Item Catalog**: Centralized repository of all items
- **Reusability**: Items can be used across multiple quotes and invoices
- **Price Preview**: Real-time calculation showing rate + tax = total
- **Search Functionality**: Find items by name or description

### How It Works

1. **Item Creation**:
   - User defines item name, rate, unit, and tax rate
   - System calculates total price (rate + tax)
   - Item is saved to catalog

2. **Item Usage in Quotes/Invoices**:
   - When creating quote/invoice, user can select from item catalog
   - Selected item auto-fills name, rate, and tax rate
   - User can adjust quantity and modify details if needed
   - Items can also be added manually without selecting from catalog

3. **Price Calculation**:
   - Base amount = quantity × rate
   - Tax amount = base amount × (tax rate / 100)
   - Total = base amount + tax amount

### Database Schema
- **Item Model**: id, name, description, rate, unit, taxRate, timestamps
- **Relationships**:
  - One-to-many with QuoteItems (optional reference)
  - One-to-many with InvoiceItems (optional reference)

### API Endpoints
- `GET /api/items` - List items (with search)
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Business Flow
```
Create Item → Add to Quote/Invoice → Calculate Totals
```

---

## 4. Quotes Module

### Overview
The Quotes module manages price quotations sent to customers. Quotes can be converted to invoices once accepted by the customer.

### Features

#### Quote Lifecycle
- **DRAFT**: Initial state, can be edited freely
- **SENT**: Quote has been sent to customer, limited editing
- **ACCEPTED**: Customer accepted the quote, ready for conversion
- **REJECTED**: Customer rejected the quote

#### Quote Components
- **Quote Number**: Auto-generated unique identifier (QUO-0001, QUO-0002, etc.)
- **Contact**: Customer receiving the quote
- **Items**: Line items with quantity, rate, tax
- **Dates**: Issue date and optional expiry date
- **Totals**: Subtotal, tax amount, and grand total
- **Notes**: Additional terms or information

#### Quote Functionality
- **Dynamic Items**: Add/remove items dynamically
- **Item Selection**: Choose from item catalog or add custom items
- **Real-time Calculations**: Automatic total calculation as items change
- **Status Management**: Update quote status through workflow
- **Quote to Invoice Conversion**: Convert accepted quotes to invoices

### How It Works

1. **Quote Creation**:
   - Select contact (customer)
   - Add items (from catalog or custom)
   - Set issue date and optional expiry date
   - System calculates subtotal, tax, and total
   - Quote is saved in DRAFT status

2. **Quote Status Workflow**:
   ```
   DRAFT → SENT → ACCEPTED → (Convert to Invoice)
                ↓
            REJECTED
   ```

3. **Quote to Invoice Conversion**:
   - Only ACCEPTED quotes can be converted
   - All quote items are copied to new invoice
   - Quote is marked as "converted to invoice"
   - Original quote data is preserved for reference
   - Quote cannot be modified after conversion

4. **Total Calculation**:
   - For each item: amount = quantity × rate
   - Item tax = amount × (tax rate / 100)
   - Subtotal = sum of all item amounts
   - Total tax = sum of all item taxes
   - Grand total = subtotal + total tax

### Database Schema
- **Quote Model**: id, quoteNumber (unique), contactId, status, issueDate, expiryDate, subtotal, taxAmount, total, notes, convertedToInvoice, invoiceId, timestamps
- **QuoteItem Model**: id, quoteId, itemId (optional), name, description, quantity, rate, taxRate, amount, timestamps
- **Relationships**:
  - Quote belongs to Contact
  - Quote has many QuoteItems
  - QuoteItem optionally belongs to Item

### API Endpoints
- `GET /api/quotes` - List quotes (with status filter)
- `GET /api/quotes/:id` - Get quote details
- `POST /api/quotes` - Create new quote
- `PUT /api/quotes/:id` - Update quote (only if not converted)
- `PATCH /api/quotes/:id/status` - Update quote status
- `DELETE /api/quotes/:id` - Delete quote (only if not converted)

### Business Flow
```
Create Quote (DRAFT) → Send Quote (SENT) → Customer Accepts (ACCEPTED) → Convert to Invoice
```

---

## 5. Invoices Module

### Overview
The Invoices module manages billing documents sent to customers. Invoices track payments and can be created from quotes or timesheets.

### Features

#### Invoice Lifecycle
- **DRAFT**: Initial state, fully editable
- **SENT**: Invoice sent to customer, read-only
- **PAID**: Invoice fully paid
- **OVERDUE**: Invoice past due date and not paid

#### Invoice Components
- **Invoice Number**: Auto-generated unique identifier (INV-0001, INV-0002, etc.)
- **Contact**: Customer being invoiced
- **Template**: Optional HTML template for rendering
- **Items**: Line items with quantity, rate, tax
- **Dates**: Issue date and due date
- **Financials**: Subtotal, tax amount, total, paid amount, remaining amount
- **Notes**: Payment terms or additional information

#### Invoice Functionality
- **Auto-numbering**: Sequential invoice numbers
- **Payment Tracking**: Track partial and full payments
- **Status Management**: Update status through workflow
- **Overdue Detection**: Automatic overdue status for past due dates
- **Quote Conversion**: Create invoice from accepted quote
- **Timesheet Integration**: Add billable hours from projects

### How It Works

1. **Invoice Creation**:
   - **Method 1**: Create from scratch
     - Select contact
     - Add items manually or from catalog
     - Set issue date and due date
     - System calculates totals
   
   - **Method 2**: Convert from Quote
     - Select accepted quote
     - All quote items are copied
     - Quote is marked as converted
     - Invoice is created in DRAFT status

   - **Method 3**: Add Project Hours
     - Select project
     - System aggregates billable hours
     - Creates invoice item with hours × hourly rate
     - Adds to existing invoice

2. **Invoice Status Workflow**:
   ```
   DRAFT → SENT → PAID
                ↓
            OVERDUE (auto if past due date)
   ```

3. **Payment Tracking**:
   - Record full payment: status → PAID, paidAmount = total
   - Record partial payment: paidAmount updated, status remains SENT
   - Remaining amount = total - paidAmount

4. **Overdue Detection**:
   - When status changes to SENT, system checks due date
   - If due date < current date, status automatically set to OVERDUE

5. **Total Calculation**:
   - Same as quotes: subtotal, tax, total
   - Additional: paidAmount tracking
   - Remaining = total - paidAmount

### Database Schema
- **Invoice Model**: id, invoiceNumber (unique), contactId, templateId (optional), status, issueDate, dueDate, subtotal, taxAmount, total, paidAmount, notes, quoteId (optional), timestamps
- **InvoiceItem Model**: id, invoiceId, itemId (optional), name, description, quantity, rate, taxRate, amount, timestamps
- **Relationships**:
  - Invoice belongs to Contact
  - Invoice optionally belongs to Template
  - Invoice optionally belongs to Quote
  - Invoice has many InvoiceItems
  - InvoiceItem optionally belongs to Item

### API Endpoints
- `GET /api/invoices` - List invoices (with status filter)
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create new invoice
- `POST /api/invoices/from-quote/:id` - Create invoice from quote
- `POST /api/invoices/add-project-hours` - Add project hours to invoice
- `PUT /api/invoices/:id` - Update invoice (only if DRAFT)
- `PATCH /api/invoices/:id/status` - Update invoice status and payment
- `DELETE /api/invoices/:id` - Delete invoice (only if DRAFT)

### Business Flows

**Flow 1: Quote to Invoice**
```
Create Quote → Send Quote → Accept Quote → Convert to Invoice → Send Invoice → Receive Payment
```

**Flow 2: Direct Invoice**
```
Create Invoice → Add Items → Send Invoice → Receive Payment
```

**Flow 3: Project to Invoice**
```
Create Project → Log Timesheets → Add Billable Hours to Invoice → Send Invoice
```

---

## 6. Projects & Timesheets Module

### Overview
The Projects & Timesheets module manages project tracking and time logging. Projects can be billed based on logged hours, which can be converted to invoice items.

### Features

#### Projects

**Project Properties**:
- **Name**: Project identifier
- **Description**: Project details
- **Contact**: Client associated with project
- **Hourly Rate**: Billing rate for billable hours
- **Status**: ACTIVE, COMPLETED, ON_HOLD, CANCELLED
- **Dates**: Start date and end date (optional)

**Project Management**:
- Create projects for clients
- Track project status
- Set hourly billing rate
- Link to contact (customer)

#### Timesheets

**Timesheet Properties**:
- **Project**: Project the time is logged for
- **Date**: Date of work
- **Hours**: Number of hours worked
- **Description**: What was worked on
- **Billable Flag**: Whether hours are billable to client

**Timesheet Management**:
- Log time entries for projects
- Mark hours as billable or non-billable
- Filter by project
- Aggregate billable hours by project

### How It Works

1. **Project Creation**:
   - Select contact (customer)
   - Set project name and hourly rate
   - Set project status (default: ACTIVE)
   - Project is ready for time tracking

2. **Time Logging**:
   - Select project
   - Enter date and hours worked
   - Add description of work
   - Mark as billable or non-billable
   - Timesheet entry is saved

3. **Billable Hours Aggregation**:
   - System calculates total billable hours per project
   - Formula: Sum of all billable hours for the project
   - Used when converting to invoice items

4. **Project to Invoice Conversion**:
   - Create or edit invoice
   - Select project
   - System aggregates all billable hours
   - Creates invoice item: "Project: [Name]" with description "[X] billable hours"
   - Amount = total hours × project hourly rate
   - Invoice totals are recalculated

### Database Schema
- **Project Model**: id, name, description, contactId, hourlyRate, status, startDate, endDate, timestamps
- **Timesheet Model**: id, projectId, date, hours, description, billable, timestamps
- **Relationships**:
  - Project belongs to Contact
  - Project has many Timesheets
  - Timesheet belongs to Project

### API Endpoints

**Projects**:
- `GET /api/projects` - List projects (with status and contact filters)
- `GET /api/projects/:id` - Get project details with timesheets
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Timesheets**:
- `GET /api/timesheets` - List timesheets (with project and billable filters)
- `GET /api/timesheets/:id` - Get timesheet details
- `GET /api/timesheets/project/:projectId/billable` - Get billable hours for project
- `POST /api/timesheets` - Create timesheet entry
- `PUT /api/timesheets/:id` - Update timesheet
- `DELETE /api/timesheets/:id` - Delete timesheet

### Business Flow
```
Create Project → Log Timesheets (Billable Hours) → Create Invoice → Add Project Hours to Invoice → Bill Client
```

---

## 7. Templates Module

### Overview
The Templates module manages HTML templates for rendering invoices and quotes. Templates allow customization of document appearance while maintaining consistent branding.

### Features

#### Template Properties
- **Name**: Template identifier
- **Description**: Template purpose or usage notes
- **Content**: HTML template with placeholders
- **Default Flag**: Mark one template as default

#### Template Functionality
- **HTML Storage**: Store complete HTML templates
- **Variable Placeholders**: Templates can include variables (e.g., {{invoiceNumber}}, {{contactName}})
- **Template Selection**: Assign template to invoice during creation
- **Default Template**: One template can be marked as default
- **Template Rendering**: System can render invoice/quote using selected template

### How It Works

1. **Template Creation**:
   - User provides template name and HTML content
   - HTML can include placeholders for dynamic data
   - Template is saved to database
   - Can be marked as default

2. **Template Assignment**:
   - When creating invoice, user can select a template
   - Template is linked to invoice
   - If no template selected, invoice uses default template (if available)

3. **Template Rendering** (Future Enhancement):
   - System replaces placeholders with actual data
   - Renders final HTML for PDF generation or email
   - Example placeholders:
     - `{{invoiceNumber}}` → INV-0001
     - `{{contactName}}` → John Doe
     - `{{total}}` → $1,000.00
     - `{{items}}` → Rendered items table

### Database Schema
- **Template Model**: id, name, description, content (TEXT), isDefault, timestamps
- **Relationships**:
  - Template has many Invoices (optional)

### API Endpoints
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get template details
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Business Flow
```
Create Template → Assign to Invoice → Render Invoice with Template
```

---

## Module Relationships & Data Flow

### Entity Relationship Diagram

```
User (Role) → Manages all modules
    ↓
Contact → Used in → Quote, Invoice, Project
    ↓
Item → Used in → QuoteItem, InvoiceItem
    ↓
Quote → Converts to → Invoice
    ↓
Project → Has → Timesheet → Converts to → InvoiceItem
    ↓
Template → Applied to → Invoice
```

### Key Business Flows

#### Flow 1: Quote to Invoice
1. Create Contact (Customer)
2. Create Items (Products/Services)
3. Create Quote with Contact and Items
4. Send Quote to Customer
5. Customer Accepts Quote
6. Convert Quote to Invoice
7. Send Invoice
8. Track Payment

#### Flow 2: Project Billing
1. Create Contact (Customer)
2. Create Project linked to Contact
3. Set Project Hourly Rate
4. Log Timesheet Entries (Billable Hours)
5. Create Invoice
6. Add Project Billable Hours to Invoice
7. Send Invoice
8. Track Payment

#### Flow 3: Direct Invoice
1. Create Contact (Customer)
2. Create Items (if needed)
3. Create Invoice with Contact and Items
4. Optionally assign Template
5. Send Invoice
6. Track Payment

---

## Technical Implementation Details

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Validation**: Zod schemas for request validation
- **Error Handling**: Centralized error middleware
- **Business Logic**: Service layer for complex operations

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Middleware enforcing permissions
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Protection**: Prisma ORM parameterized queries

### Data Integrity
- **Foreign Key Constraints**: Database-level relationships
- **Cascade Deletes**: Automatic cleanup of related records
- **Unique Constraints**: Prevent duplicate invoice/quote numbers
- **Immutable Records**: Converted quotes cannot be modified

---

## Module Dependencies

### Core Dependencies
- **Users & Roles**: Required for all operations (authentication)
- **Contacts**: Required for Quotes, Invoices, Projects
- **Items**: Optional but recommended for Quotes/Invoices

### Optional Dependencies
- **Templates**: Optional for Invoices
- **Projects**: Optional, only needed for time tracking
- **Timesheets**: Optional, only needed for project billing

### Conversion Dependencies
- **Quote → Invoice**: Requires Quote to be ACCEPTED
- **Timesheet → Invoice**: Requires Project with billable hours

---

## Limitations & Future Enhancements

### Current Limitations
- No email sending functionality
- No PDF generation
- No payment gateway integration
- No multi-currency support
- No recurring invoices
- No invoice reminders
- No reports/analytics
- No client portal

### Potential Enhancements
- Email notifications for quotes/invoices
- PDF generation for documents
- Payment gateway integration
- Multi-currency support
- Recurring invoice automation
- Advanced reporting and analytics
- Client self-service portal
- Mobile app
- API webhooks
- Document attachments

---

## Summary

This Zoho Invoice clone implements 7 core modules that work together to provide a complete invoicing solution:

1. **Users & Roles**: Foundation for authentication and authorization
2. **Contacts**: Customer and vendor management
3. **Items**: Product/service catalog
4. **Quotes**: Price quotations with conversion capability
5. **Invoices**: Billing documents with payment tracking
6. **Projects & Timesheets**: Time tracking and project billing
7. **Templates**: Document customization

All modules are fully integrated, allowing seamless workflows from quote creation to invoice payment, with support for both product-based and time-based billing models.

