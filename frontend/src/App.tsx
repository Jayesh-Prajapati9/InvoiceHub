import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Landing from './pages/Landing';

// Pages
import Dashboard from './pages/Dashboard';
import UsersList from './pages/Users/UsersList';
import UserForm from './pages/Users/UserForm';
import ContactsList from './pages/Contacts/ContactsList';
import ContactForm from './pages/Contacts/ContactForm';
import ContactDetail from './pages/Contacts/ContactDetail';
import ItemsList from './pages/Items/ItemsList';
import ItemForm from './pages/Items/ItemForm';
import ItemDetail from './pages/Items/ItemDetail';
import QuotesList from './pages/Quotes/QuotesList';
import QuoteForm from './pages/Quotes/QuoteForm';
import QuoteDetail from './pages/Quotes/QuoteDetail';
import InvoicesList from './pages/Invoices/InvoicesList';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import PaymentForm from './pages/Invoices/PaymentForm';
import ProjectsList from './pages/Projects/ProjectsList';
import ProjectForm from './pages/Projects/ProjectForm';
import ProjectDetail from './pages/Projects/ProjectDetail';
import TimesheetsList from './pages/Timesheets/TimesheetsList';
import TimesheetForm from './pages/Timesheets/TimesheetForm';
import TemplatesList from './pages/Templates/TemplatesList';
import TemplateForm from './pages/Templates/TemplateForm';
import Settings from './pages/Settings/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  {/* Contact routes with specific paths first to avoid conflicts */}
                  <Route path="/contacts/new" element={
                    <Layout>
                      <ContactForm />
                    </Layout>
                  } />
                  <Route path="/contacts/:id/edit" element={
                    <Layout>
                      <ContactForm />
                    </Layout>
                  } />
                  <Route path="/contacts/:id" element={
                    <Layout>
                      <ContactDetail />
                    </Layout>
                  } />
                  
                  {/* Item routes with specific paths first to avoid conflicts */}
                  <Route path="/items/new" element={
                    <Layout>
                      <ItemForm />
                    </Layout>
                  } />
                  <Route path="/items/:id/edit" element={
                    <Layout>
                      <ItemForm />
                    </Layout>
                  } />
                  <Route path="/items/:id" element={
                    <Layout>
                      <ItemDetail />
                    </Layout>
                  } />
                  
                  {/* Quote routes with specific paths first to avoid conflicts */}
                  <Route path="/quotes/new" element={
                    <Layout>
                      <QuoteForm />
                    </Layout>
                  } />
                  <Route path="/quotes/:id/edit" element={
                    <Layout>
                      <QuoteForm />
                    </Layout>
                  } />
                  <Route path="/quotes/:id" element={
                    <Layout>
                      <QuoteDetail />
                    </Layout>
                  } />
                  
                  {/* Invoice routes with specific paths first to avoid conflicts */}
                  <Route path="/invoices/new" element={
                    <Layout>
                      <InvoiceForm />
                    </Layout>
                  } />
                  <Route path="/invoices/:invoiceId/payment" element={
                    <Layout>
                      <PaymentForm />
                    </Layout>
                  } />
                  <Route path="/invoices/:id/edit" element={
                    <Layout>
                      <InvoiceForm />
                    </Layout>
                  } />
                  <Route path="/invoices/:id" element={
                    <Layout>
                      <InvoiceDetail />
                    </Layout>
                  } />
                  
                  {/* All other routes use the main Layout */}
                  <Route
                    path="*"
                    element={
                      <Layout>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/users" element={<UsersList />} />
                          <Route path="/users/new" element={<UserForm />} />
                          <Route path="/users/:id" element={<UserForm />} />
                          <Route path="/contacts" element={<ContactsList />} />
                          <Route path="/items" element={<ItemsList />} />
                          <Route path="/quotes" element={<QuotesList />} />
                          <Route path="/invoices" element={<InvoicesList />} />
                          <Route path="/projects" element={<ProjectsList />} />
                          <Route path="/projects/new" element={<ProjectForm />} />
                          <Route path="/projects/:id/edit" element={<ProjectForm />} />
                          <Route path="/projects/:id" element={<ProjectDetail />} />
                          <Route path="/timesheets" element={<TimesheetsList />} />
                          <Route path="/timesheets/new" element={<TimesheetForm />} />
                          <Route path="/timesheets/:id" element={<TimesheetForm />} />
                          <Route path="/templates" element={<TemplatesList />} />
                          <Route path="/templates/new" element={<TemplateForm />} />
                          <Route path="/templates/:id" element={<TemplateForm />} />
                          <Route path="/settings" element={
                            <Layout>
                              <Settings />
                            </Layout>
                          } />
                        </Routes>
                      </Layout>
                    }
                  />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

