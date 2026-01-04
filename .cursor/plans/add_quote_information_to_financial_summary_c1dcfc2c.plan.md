---
name: Add Quote Information to Financial Summary
overview: Add quote statistics and potential income metrics to the FinancialSummary component. This includes backend calculations for quote totals, counts, and pending quotes, plus frontend display of a separate Quotes section and Potential Income metric.
todos: []
---

# Add Quote Information to Financial Summary

## Overview

Enhance the FinancialSummary component to include quote-related information: a separate Quotes section with statistics and a Potential Income metric showing the total value of quotes that could convert to invoices.

## Backend Changes

### 1. Update `backend/src/services/contactService.ts`

- Add `calculateQuoteStatistics()` function to:
                                - Get all quotes for a contact (excluding converted ones)
                                - Calculate total value of all quotes
                                - Count total quotes
                                - Count pending quotes (status: SENT, DRAFT)
                                - Count accepted quotes (status: ACCEPTED)
                                - Calculate potential income (total value of non-converted quotes)
- Update `getFinancialSummary()` to include quote statistics in the response
- Update `updateFinancialSummary()` to calculate and cache quote data

### 2. Update `backend/src/controllers/contactController.ts`

- Modify `getContactFinancialSummary()` to include quote statistics in the API response

## Frontend Changes

### 3. Update `frontend/src/components/Contacts/FinancialSummary.tsx`

- Add a new "Quotes" section displaying:
                                - Total Quotes Value (sum of all quote totals)
                                - Total Quotes Count
                                - Pending Quotes Count (SENT, DRAFT status)
                                - Accepted Quotes Count
- Add "Potential Income" metric showing total value of quotes that haven't been converted to invoices
- Update the component to handle the new quote data from the API

## Data Flow

```
FinancialSummary Component
    ↓
API: GET /contacts/:id/financial-summary
    ↓
Backend: getFinancialSummary()
    ↓
calculateQuoteStatistics()
    ↓
Returns:
  - outstandingReceivables (existing)
  - unusedCredits (existing)
  - totalIncome (existing)
  - quoteStatistics: {
      totalValue: Decimal,
      totalCount: number,
      pendingCount: number,
      acceptedCount: number,
      potentialIncome: Decimal
    }
```

## Implementation Details

### Quote Statistics Calculation

- Query quotes where `contactId` matches and `convertedToInvoice` is false
- Group by status to get counts
- Sum all quote totals for potential income
- Cache results in `ContactFinancialSummary` model (may need schema update)

### UI Layout

- Place "Quotes" section after "Receivables" section
- Display metrics in a similar format to receivables
- Add "Potential Income" as a prominent metric (could be above or in quotes section)