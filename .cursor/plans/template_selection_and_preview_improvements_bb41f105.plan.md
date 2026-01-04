---
name: Template Selection and Preview Improvements
overview: Add a "Change Template" button next to Edit button with a styled dropdown menu, remove the "Change" link from template footer, fix A4 preview spacing, and update preview when template is selected (preview-only, not saved until Edit is used).
todos: []
---

# Template Selection and Preview Improvements

## Overview

Add template selection functionality in the quote detail header, remove the "Change" link from template footer, fix A4 preview spacing, and enable real-time template preview updates.

## Changes Required

### 1. Frontend: QuoteDetail Component

**File:** `frontend/src/pages/Quotes/QuoteDetail.tsx`

- **Add template selection dropdown:**
- Add "Change Template" button next to Edit button in header
- Create styled dropdown menu (using Headless UI Menu or similar) that shows list of templates
- Fetch templates using `useQuery` with key `['templates']`
- Show current template name in button or as selected state

- **Template preview update logic:**
- Add state to track selected template for preview: `const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)`
- When template is selected from dropdown, update `previewTemplateId` state
- Modify the quote query to accept `templateId` parameter or create a separate endpoint to render template
- When `previewTemplateId` changes, fetch rendered HTML with new template (or re-render on frontend)
- Preview updates immediately but doesn't save to quote until Edit is used

- **Fix A4 preview spacing:**
- Remove extra padding/margins causing extra space
- Ensure iframe fits exactly to A4 dimensions (210mm × 297mm)
- Fix container to prevent double scrollbars

- **Remove "Change" link from template footer:**
- The "Change" link is in the rendered HTML template, so we need to remove it from the default template HTML

### 2. Backend: Template Rendering

**File:** `backend/src/controllers/quoteController.ts`

- **Add endpoint for preview rendering (optional):**
- Create `POST /quotes/:id/preview` endpoint that accepts `templateId` and returns rendered HTML
- Or modify `getQuoteById` to accept optional `templateId` query parameter for preview
- This allows previewing different templates without saving

**Alternative approach (simpler):**

- Re-render template on frontend when `previewTemplateId` changes
- Use the existing `renderQuoteTemplate` utility but pass the selected template's content

### 3. Backend: Default Template

**File:** `backend/src/utils/defaultQuoteTemplate.ts`

- **Remove "Change" link:**
- Remove the `<a href="#">Change</a>` link from the template footer
- Keep only: `PDF Template: '{{templateName}}'`

### 4. Frontend: Template Renderer (if needed)

**File:** `frontend/src/utils/templateRenderer.ts` (new file, if re-rendering on frontend)

- Create a frontend version of template renderer that can process template HTML with quote data
- This would allow instant preview updates without API calls

## Implementation Details

### Template Dropdown Component

- Use Headless UI `Menu` component for styled dropdown
- Position dropdown below "Change Template" button
- Show template list with current template highlighted
- On selection, update preview state and re-render

### Preview Update Flow

1. User clicks "Change Template" → dropdown opens
2. User selects template → `previewTemplateId` state updates
3. Fetch template content (if not already cached)
4. Re-render quote with new template HTML
5. Preview updates immediately
6. When user clicks Edit, the selected template is saved to quote

### A4 Size Fix

- Set iframe to exact A4 dimensions: `width: 210mm, height: 297mm`
- Remove any extra padding/margins from container
- Ensure single scrollbar only on outer container

## Files to Modify

1. `frontend/src/pages/Quotes/QuoteDetail.tsx` - Add template dropdown, fix preview sizing
2. `backend/src/utils/defaultQuoteTemplate.ts` - Remove "Change" link
3. `backend/src/controllers/quoteController.ts` - Optional: Add preview endpoint
4. `frontend/src/utils/templateRenderer.ts` - Optional: Frontend template renderer

## Testing Considerations

- Verify template dropdown shows all available templates
- Verify preview updates when template is selected
- Verify A4 size is correct (210mm × 297mm)
- Verify no double scrollbars
- Verify "Change" link is removed from template footer
- Verify template selection persists when navigating away and back (if using preview-only approach)