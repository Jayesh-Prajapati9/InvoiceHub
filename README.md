# Zoho Invoice – Partial Clone

This project is a **partial functional clone of Zoho Invoice**, built strictly for
evaluation purposes using **AI-driven (Vibe Coding) development**.

> Only selected modules are implemented. This is NOT a full Zoho Invoice clone.

---

## 🔹 Reference Product
Inspired by: Zoho Invoice (Invoicing Software)

---

## 🔹 Included Modules

✔ Invoicing  
✔ Quotes  
✔ Contacts  
✔ Projects & Timesheets  
✔ Templates  
✔ Users & Roles  
✔ Items  

❌ Payments  
❌ Reports  
❌ Client Portal  
❌ Tax Compliance  
❌ Integrations  

---

## 🔹 Tech Stack

**Frontend**
- React + TypeScript
- Tailwind CSS
- React Hook Form
- TanStack Query

**Backend**
- Node.js + TypeScript
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication

---

## 🔹 Key Business Flows

### Quote to Invoice
Contact → Quote → Accepted → Invoice

### Project Billing
Project → Timesheet → Billable Hours → Invoice

### Role Control
Admin → Full Access  
Staff → Limited Access

---

## 🔹 AI / Vibe Coding Usage

AI was used extensively to:
- Design Prisma schema
- Generate REST APIs
- Build React forms & tables
- Generate validation schemas
- Refactor and debug code
- Speed up UI & logic development

All modules were implemented using **AI-assisted prompts** with human validation.

---

## 🔹 Testing & Validation

- Role-based access checks
- API request validation
- Manual end-to-end flow testing
- Edge case handling

---

## 🔹 Known Limitations

- No payment gateway
- No email automation
- No reports or analytics
- No multi-currency support

---

## 🔹 Timeline

Total effort: **3–4 days**
Final delivery aligned with evaluation deadline.

---

## 🔹 Getting Started

See [SETUP.md](./SETUP.md) for detailed installation and setup instructions.

Quick start:
```bash
pnpm install
cd backend && cp .env.example .env  # Add your DATABASE_URL
pnpm prisma:generate && pnpm prisma:migrate
cd .. && pnpm dev
```

---

## 🔹 Project Structure

```
zoho-invoice/
├── backend/          # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   └── prisma/
│       └── schema.prisma
├── frontend/         # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
└── Docs/            # Documentation
```

---

## 🔹 Conclusion

This project demonstrates:
- Feature understanding
- Clear requirement analysis
- End-to-end execution
- Effective AI utilization
- Real-world SaaS architecture
