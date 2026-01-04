/**
 * Purple Elegant Template - An elegant template with purple accent colors
 * Works for both invoices and quotes
 */
export const getPurpleElegantTemplateHTML = () => {
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
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 0 auto;
      padding: 20px;
      padding-bottom: 10px;
      background: white;
      color: #1f2937;
      width: 210mm;
      max-width: 210mm;
      height: auto;
      min-height: auto;
      box-sizing: border-box;
    }
    .header {
      position: relative;
      padding: 15px 0;
      margin-bottom: 20px;
      border-top: 4px solid #7c3aed;
      border-bottom: 2px solid #a78bfa;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%);
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
      color: #374151;
    }
    .company-info strong {
      font-size: 14px;
      color: #7c3aed;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .document-title {
      text-align: right;
    }
    .document-title h1 {
      font-size: 22px;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #7c3aed;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .document-info {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    .document-info p {
      margin: 2px 0;
    }
    .document-info strong {
      color: #7c3aed;
    }
    .bill-to {
      background: linear-gradient(to right, #faf5ff 0%, #ffffff 100%);
      padding: 12px;
      border-left: 4px solid #7c3aed;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
    }
    .bill-to h3 {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #6d28d9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .bill-to p {
      margin: 2px 0;
      font-size: 12px;
      color: #374151;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: white;
      padding: 8px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: none;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
      color: #374151;
      background: white;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    tbody tr:hover {
      background-color: #faf5ff;
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
      background: linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%);
      padding: 12px;
      border-radius: 6px;
      border: 2px solid #a78bfa;
      box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #374151;
    }
    .summary-total {
      border-top: 2px solid #7c3aed;
      padding-top: 8px;
      margin-top: 6px;
      font-weight: 700;
      font-size: 14px;
      color: #6d28d9;
    }
    .total-words {
      margin-top: 8px;
      font-size: 11px;
      color: #6b7280;
      font-style: italic;
      padding-top: 6px;
      border-top: 1px solid #e5e7eb;
    }
    .notes, .terms {
      background: linear-gradient(to right, #faf5ff 0%, #ffffff 100%);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      border-left: 4px solid #7c3aed;
      box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
    }
    .notes h4, .terms h4 {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #6d28d9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .notes p, .terms p {
      font-size: 12px;
      margin: 0;
      color: #374151;
      line-height: 1.5;
    }
    .signature {
      margin-top: 20px;
      margin-bottom: 0;
      page-break-inside: avoid;
    }
    .signature h4 {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #6d28d9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signature-line {
      border-bottom: 2px solid #7c3aed;
      width: 250px;
      height: 40px;
    }
    .draft-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: #ede9fe;
      opacity: 0.25;
      font-weight: 300;
      pointer-events: none;
      z-index: 1;
    }
    .content-wrapper {
      position: relative;
      z-index: 2;
    }
    .template-footer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 2px solid #a78bfa;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
      margin-bottom: 0;
      page-break-inside: avoid;
    }
    .quote-section {
      background: linear-gradient(to right, #faf5ff 0%, #ffffff 100%);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      border-left: 4px solid #7c3aed;
      box-shadow: 0 2px 4px rgba(124, 58, 237, 0.1);
    }
    .quote-section h3 {
      margin-bottom: 6px;
      color: #6d28d9;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .quote-section p {
      margin: 2px 0;
      font-size: 12px;
      color: #374151;
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
      background-color: #faf5ff !important;
    }
    .header-row td {
      font-weight: 600;
      font-size: 12px;
      color: #6d28d9;
      border-bottom: 2px solid #a78bfa;
      letter-spacing: 0.2px;
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
            <br><small style="color: #9ca3af;">{{description}}</small>
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

