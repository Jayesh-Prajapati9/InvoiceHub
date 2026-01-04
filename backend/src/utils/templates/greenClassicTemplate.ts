/**
 * Green Classic Template - A classic template with green accent colors
 * Works for both invoices and quotes
 */
export const getGreenClassicTemplateHTML = () => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      margin: 0 auto;
      padding: 20px;
      padding-bottom: 10px;
      background: #fafafa;
      color: #2d3748;
      width: 210mm;
      max-width: 210mm;
      height: auto;
      min-height: auto;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 4px solid #059669;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-info {
      font-size: 12px;
      line-height: 1.5;
    }
    .company-info p {
      margin: 2px 0;
      color: #2d3748;
    }
    .company-info strong {
      font-size: 14px;
      color: #059669;
      font-weight: bold;
    }
    .document-title {
      text-align: right;
    }
    .document-title h1 {
      font-size: 22px;
      font-weight: bold;
      margin: 0 0 8px 0;
      color: #059669;
      font-style: italic;
    }
    .document-info {
      text-align: right;
      font-size: 12px;
      color: #4a5568;
      line-height: 1.5;
    }
    .document-info p {
      margin: 2px 0;
    }
    .bill-to {
      background: #f0fdf4;
      padding: 12px;
      border: 2px solid #059669;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .bill-to h3 {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #047857;
      text-decoration: underline;
    }
    .bill-to p {
      margin: 2px 0;
      font-size: 12px;
      color: #2d3748;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 2px solid #059669;
    }
    th {
      background: #059669;
      color: white;
      padding: 8px;
      text-align: left;
      font-size: 11px;
      font-weight: bold;
      border: 1px solid #047857;
    }
    td {
      padding: 8px;
      border: 1px solid #d1d5db;
      font-size: 12px;
      color: #2d3748;
      background: white;
    }
    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .text-right {
      text-align: right;
    }
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .summary-content {
      width: 280px;
      background: #f0fdf4;
      padding: 12px;
      border-radius: 4px;
      border: 2px solid #059669;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #2d3748;
    }
    .summary-total {
      border-top: 2px solid #059669;
      padding-top: 8px;
      margin-top: 6px;
      font-weight: bold;
      font-size: 14px;
      color: #047857;
    }
    .total-words {
      margin-top: 8px;
      font-size: 11px;
      color: #4a5568;
      font-style: italic;
    }
    .notes, .terms {
      background: #f0fdf4;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 15px;
      border-left: 4px solid #059669;
    }
    .notes h4, .terms h4 {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 6px;
      color: #047857;
      text-decoration: underline;
    }
    .notes p, .terms p {
      font-size: 12px;
      margin: 0;
      color: #2d3748;
      line-height: 1.5;
    }
    .signature {
      margin-top: 20px;
      margin-bottom: 0;
      page-break-inside: avoid;
    }
    .signature h4 {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 6px;
      color: #047857;
    }
    .signature-line {
      border-bottom: 2px solid #059669;
      width: 250px;
      height: 40px;
    }
    .draft-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: #d1fae5;
      opacity: 0.25;
      font-weight: bold;
      pointer-events: none;
      z-index: 1;
    }
    .content-wrapper {
      position: relative;
      z-index: 2;
    }
    .template-footer {
      margin-top: 12px;
      padding-top: 8px;
      border-top: 2px solid #059669;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 0;
      page-break-inside: avoid;
    }
    .quote-section {
      background: #f0fdf4;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      border: 2px solid #059669;
    }
    .quote-section h3 {
      margin-bottom: 8px;
      color: #047857;
      font-size: 14px;
      font-weight: bold;
    }
    .quote-section p {
      margin: 4px 0;
      font-size: 14px;
      color: #2d3748;
    }
    /* Page break handling */
    table {
      page-break-inside: auto;
    }
    thead {
      display: table-header-group;
    }
    tbody {
      display: table-row-group;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    tfoot {
      display: table-footer-group;
    }
    .header-row {
      background-color: #d1fae5 !important;
    }
    .header-row td {
      font-weight: bold;
      font-size: 12px;
      color: #047857;
      border-bottom: 2px solid #059669;
      padding: 8px;
    }
  </style>
</head>
<body>
  {{#if isDraft}}
  <div class="draft-watermark">Draft</div>
  {{/if}}
  
  <div class="content-wrapper">
    <div class="header">
      <div class="header-content">
        <div class="company-info">
          <p><strong>{{companyName}}</strong></p>
          <p>{{companyAddress}}</p>
          <p>{{companyCity}}, {{companyState}} {{companyZipCode}}</p>
          <p>{{companyCountry}}</p>
          <p>{{companyEmail}}</p>
        </div>
        <div class="document-title">
          <h1>{{#if invoiceNumber}}INVOICE{{else}}QUOTE{{/if}}</h1>
          <div class="document-info">
            {{#if invoiceNumber}}
            <p><strong>#</strong> {{invoiceNumber}}</p>
            <p><strong>Date:</strong> {{issueDate}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            {{else}}
            {{#if quoteNumber}}
            <p><strong>#</strong> {{quoteNumber}}</p>
            {{/if}}
            <p><strong>Date:</strong> {{issueDate}}</p>
            {{/if}}
          </div>
        </div>
      </div>
    </div>

    <div class="bill-to">
      <h3>Bill To</h3>
      <p><strong>{{contactName}}</strong></p>
      <p>{{billingAddress}}</p>
      <p>{{billingCity}}, {{billingState}} {{billingZipCode}}</p>
      <p>{{billingCountry}}</p>
    </div>

    {{#if quoteNumber}}
    <div class="quote-section">
      <h3>Associated Quote</h3>
      <p><strong>Quote #:</strong> {{quoteNumber}}</p>
    </div>
    {{/if}}

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item & Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        {{#if (eq type "HEADER")}}
        <tr class="header-row">
          <td colspan="5">{{name}}</td>
        </tr>
        {{else}}
        <tr>
          <td>{{@index}}</td>
          <td>
            <strong>{{name}}</strong>
            {{#if description}}
            <br><small style="color: #6b7280;">{{description}}</small>
            {{/if}}
          </td>
          <td class="text-right">{{quantity}}</td>
          <td class="text-right">{{rate}}</td>
          <td class="text-right">{{amount}}</td>
        </tr>
        {{/if}}
        {{/each}}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-content">
        <div class="summary-row">
          <span>Sub Total</span>
          <span>{{subtotal}}</span>
        </div>
        {{#if taxAmount}}
        <div class="summary-row">
          <span>Tax</span>
          <span>{{taxAmount}}</span>
        </div>
        {{/if}}
        <div class="summary-row summary-total">
          <span>Total</span>
          <span>{{total}}</span>
        </div>
        {{#if paidAmount}}
        <div class="summary-row">
          <span>Paid</span>
          <span>{{paidAmount}}</span>
        </div>
        {{/if}}
        {{#if remainingAmount}}
        <div class="summary-row">
          <span>Remaining</span>
          <span>{{remainingAmount}}</span>
        </div>
        {{/if}}
        <div class="total-words">
          Total in Words: <strong>{{totalInWords}}</strong>
        </div>
      </div>
    </div>

    {{#if notes}}
    <div class="notes">
      <h4>Notes</h4>
      <p>{{notes}}</p>
    </div>
    {{/if}}

    <div class="terms">
      <h4>Terms & Conditions</h4>
      <p>Standard terms and conditions apply.</p>
    </div>

    <div class="signature">
      <h4>Authorized Signature</h4>
      <div class="signature-line"></div>
    </div>

    <div class="template-footer">
      PDF Template: '{{templateName}}'
    </div>
  </div>
</body>
</html>`;
};

