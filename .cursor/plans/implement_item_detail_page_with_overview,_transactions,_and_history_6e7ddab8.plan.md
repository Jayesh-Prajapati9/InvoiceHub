---
name: Implement Item Detail Page with Overview, Transactions, and History
overview: Create a comprehensive Item Detail page similar to ContactDetail, with a left sidebar listing items, a main panel with tabs (Overview, Transactions, History), and full functionality for viewing item details, transactions where items are used, and activity history.
todos:
  - id: schema-updates
    content: "Update Prisma schema: Add ItemActivityLog model, add itemType to Item, add relations"
    status: pending
  - id: backend-item-controller
    content: "Update itemController: Add getItemTransactions and getItemActivityLogs endpoints, add activity logging to CRUD operations"
    status: pending
    dependencies:
      - schema-updates
  - id: backend-activity-controller
    content: Create itemActivityLogController with getItemActivityLogs and createItemActivityLog functions
    status: pending
    dependencies:
      - schema-updates
  - id: backend-routes
    content: "Update items routes: Add /items/:id/transactions and /items/:id/activities routes"
    status: pending
    dependencies:
      - backend-item-controller
      - backend-activity-controller
  - id: frontend-items-list
    content: "Update ItemsList: Make item names clickable to navigate to detail page"
    status: pending
  - id: frontend-item-detail
    content: "Create ItemDetail page: Full-screen layout with sidebar, header, and tabs"
    status: pending
  - id: frontend-items-sidebar
    content: "Create ItemsSidebar component: Display list of items with current item highlighted"
    status: pending
  - id: frontend-item-overview
    content: "Create ItemOverview component: Display item details (type, unit, price, description)"
    status: pending
  - id: frontend-item-transactions
    content: "Create ItemTransactions component: Display table of quotes/invoices using this item"
    status: pending
  - id: frontend-item-history
    content: "Create ItemHistory component: Display activity log timeline for the item"
    status: pending
  - id: frontend-routing
    content: "Update App.tsx: Add route for ItemDetail page"
    status: pending
    dependencies:
      - frontend-item-detail
---

# Implement Item Detail Page with Overview, Transactions, and History

## Overview

Create a detailed view for items with a split-panel layout: left sidebar showing all items, right panel with tabs for Overview, Transactions, and History. Similar to ContactDetail implementation.

## Database Schema Changes

### 1. Update `backend/prisma/schema.prisma`

- Add `itemType` field to `Item` model (enum: SALES, PURCHASE, SERVICE) - default to SALES
- Create `ItemActivityLog` model similar to `ActivityLog` but for items:
- `id`, `itemId`, `userId`, `action`, `description`, `metadata`, `createdAt`
- Relation to `Item` and `User`
- Add `itemActivityLogs` relation to `Item` model
- Add `itemActivityLogs` relation to `User` model

## Backend Changes

### 2. Update `backend/src/controllers/itemController.ts`

- Update `getItemById` to include:
- Count of quotes using this item
- Count of invoices using this item
- Total quantity sold (sum from quoteItems and invoiceItems)
- Add `getItemTransactions` endpoint:
- Get all quotes where item is used (via QuoteItem)
- Get all invoices where item is used (via InvoiceItem)
- Return: date, document number, customer name, quantity, price, total, status
- Add `getItemActivityLogs` endpoint:
- Get all activity logs for the item
- Include user information
- Update `createItem`, `updateItem`, `deleteItem` to create activity logs

### 3. Create `backend/src/controllers/itemActivityLogController.ts`

- `getItemActivityLogs` - Get activity logs for an item
- `createItemActivityLog` - Create activity log (used internally)

### 4. Update `backend/src/routes/items.ts`

- Add route: `GET /items/:id/transactions` - Get item transactions
- Add route: `GET /items/:id/activities` - Get item activity logs
- Reorder routes to prioritize specific paths before `/:id`

## Frontend Changes

### 5. Update `frontend/src/pages/Items/ItemsList.tsx`

- Make item names clickable (Link to `/items/:id`)
- Change edit button behavior or keep both (click name for detail, icon for edit)
- Update styling to match screenshot (clickable names)

### 6. Create `frontend/src/pages/Items/ItemDetail.tsx`

- Similar structure to `ContactDetail.tsx`
- Fixed full-screen layout with:
- Left sidebar: `ItemsSidebar` component
- Main content: Header with item name, Edit button, tabs
- Tabs: Overview, Transactions, History
- Tab content components

### 7. Create `frontend/src/components/Items/ItemsSidebar.tsx`

- Fetch and display list of all items
- Highlight current item
- Show item name and rate
- Clickable to navigate between items
- Similar to `ContactsSidebar`

### 8. Create `frontend/src/components/Items/ItemOverview.tsx`

- Display item details:
- Item Type (Sales Items)
- Unit
- Created Source (User)
- Sales Information section:
- Selling Price (rate)
- Description
- Similar layout to ContactOverview

### 9. Create `frontend/src/components/Items/ItemTransactions.tsx`

- Fetch item transactions from API
- Display table with columns:
- DATE
- QUOTE/INVOICE NUMBER
- CUSTOMER NAME
- QUANTITY SOLD
- PRICE
- TOTAL
- STATUS
- Filter dropdowns: "Filter By: Quotes/Invoices" and "Status: All"
- Show both quotes and invoices in one table or separate sections

### 10. Create `frontend/src/components/Items/ItemHistory.tsx`

- Fetch item activity logs from API
- Display timeline/table with:
- DATE
- DETAILS (action description with user info)
- Similar to Contact ActivityLog component

### 11. Update `frontend/src/App.tsx`

- Add route for ItemDetail: `/items/:id` (before `/items/new` and `/items/:id/edit`)
- Import ItemDetail component
- Similar routing pattern to contacts

## Implementation Details

### Activity Log Actions

- `ITEM_CREATED` - "Item {name} has been created by {user}"
- `ITEM_UPDATED` - "Item {name} has been updated by {user}"
- `ITEM_DELETED` - "Item {name} has been deleted by {user}"

### Transaction Data Structure

- Combine QuoteItem and InvoiceItem data
- Include quote/invoice number, contact name, dates, quantities, prices
- Calculate totals per transaction

### UI Layout

- Full-screen fixed layout (similar to ContactDetail)
- Left sidebar: ~250px width, scrollable
- Main panel: flex-1, with header and tabs
- Responsive design considerations

## Files to Create/Modify

**Backend:**

- `backend/prisma/schema.prisma` - Add ItemActivityLog model, update Item model
- `backend/src/controllers/itemController.ts` - Add transaction and activity endpoints
- `backend/src/controllers/itemActivityLogController.ts` - New file
- `backend/src/routes/items.ts` - Add new routes

**Frontend:**

- `frontend/src/pages/Items/ItemDetail.tsx` - New file
- `frontend/src/pages/Items/ItemsList.tsx` - Update for clickable items
- `frontend/src/components/Items/ItemsSidebar.tsx` - New file
- `frontend/src/components/Items/ItemOverview.tsx` - New file
- `frontend/src/components/Items/ItemTransactions.tsx` - New file
- `frontend/src/components/Items/ItemHistory.tsx` - New file
- `frontend/src/App.tsx` - Add routing