import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowRightIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const Landing = () => {
  const { user } = useAuth();

  // If user is already logged in, they'll be redirected by ProtectedRoute logic
  // But we can still show the landing page as it has navigation

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">IH</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Invoice Hub</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Product
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Plans
              </a>
              <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                About Us
              </a>
              <a href="#faq" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                FAQ
              </a>
            </div>

            {/* Log In Button */}
            <div className="flex items-center space-x-4">
              {!user ? (
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Effortlessly Create &<br />
                Manage Your Invoices
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Our invoice app is designed to make invoicing simple and stress-free. 
                As a small business owner, create and manage your invoices quickly and easily.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started For Free
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                Learn more
                <ArrowRightIcon className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Footer Text */}
            <p className="text-sm text-gray-400 pt-4">
              Designed by: The Invoice Hub Team
            </p>
          </div>

          {/* Right Side - Visual Elements */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            {/* Background decorative shapes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-md relative">
                {/* Large circular gradient */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-50"></div>
                
                {/* Medium shapes */}
                <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 left-10 w-56 h-56 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Floating Payment Icons */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {/* Debit Card Icon - Top Right */}
              <div className="absolute top-0 right-8 bg-white rounded-xl shadow-lg p-3 transform rotate-12 hover:rotate-6 transition-transform">
                <CreditCardIcon className="w-10 h-10 text-gray-700" />
              </div>

              {/* Mastercard Icon - Mid Left */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-white rounded-xl shadow-lg p-3 transform -rotate-12 hover:-rotate-6 transition-transform">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">MC</span>
                </div>
              </div>

              {/* PayPal Icon - Bottom Right */}
              <div className="absolute bottom-8 right-16 bg-white rounded-xl shadow-lg p-3 transform rotate-6 hover:rotate-0 transition-transform">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PP</span>
                </div>
              </div>

              {/* Main Dashboard Preview */}
              <div className="relative z-20 w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="text-white text-xs font-medium">Invoice Hub Dashboard</div>
                    <div className="w-6"></div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="p-4 bg-gray-50">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
                        <div className="text-lg font-bold text-gray-900">$24,580</div>
                        <div className="text-xs text-green-600 mt-1">+12.5%</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Outstanding</div>
                        <div className="text-lg font-bold text-gray-900">$8,420</div>
                        <div className="text-xs text-orange-600 mt-1">5 invoices</div>
                      </div>
                    </div>
                    
                    {/* Invoice List */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="text-sm font-semibold text-gray-900">Recent Invoices</div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[
                          { client: 'Acme Corp', amount: '$2,450', status: 'Paid', date: 'Jan 15' },
                          { client: 'Tech Solutions', amount: '$1,890', status: 'Pending', date: 'Jan 18' },
                          { client: 'Global Inc', amount: '$3,200', status: 'Paid', date: 'Jan 20' },
                        ].map((invoice, idx) => (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{invoice.client}</div>
                                  <div className="text-xs text-gray-500">{invoice.date}</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{invoice.amount}</div>
                              <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                                invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {invoice.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="mt-4 flex space-x-2">
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-600">New Invoice</div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-center">
                        <UserGroupIcon className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-600">Contacts</div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-center">
                        <ChartBarIcon className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-600">Reports</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Protection Callout - Bottom Right, overlapping with illustration */}
              <div className="absolute bottom-0 right-0 bg-gray-900 rounded-2xl shadow-2xl p-4 max-w-[280px] transform hover:scale-105 transition-transform z-30">
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="w-7 h-7 text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-bold text-sm mb-1">Data Protection</p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      You can be rest assured that your data is well protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Invoices
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your invoicing process and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Professional Invoices</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate beautiful, professional invoices in minutes. Customize templates and branding to match your business.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Manage Contacts</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep track of all your clients and contacts in one place. Add contact persons and manage relationships effortlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <DocumentDuplicateIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quotes & Estimates</h3>
              <p className="text-gray-600 leading-relaxed">
                Create quotes and convert them to invoices with one click. Track quote status and manage your sales pipeline.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Project Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Track projects, manage timesheets, and bill clients based on hours worked. Perfect for service-based businesses.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mb-6">
                <BanknotesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Payment Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Record and track payments, mark invoices as paid, and monitor your cash flow in real-time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Get insights into your business with comprehensive dashboards. Track revenue, outstanding invoices, and more.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Timesheet Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Log hours worked on projects and automatically generate invoices based on billable hours.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Templates</h3>
              <p className="text-gray-600 leading-relaxed">
                Create and save custom invoice templates. Reuse them for faster invoice creation and consistent branding.
              </p>
            </div>

            {/* Feature 9 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center mb-6">
                <LockClosedIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed">
                Your data is encrypted and secure. Role-based access control ensures only authorized users can access sensitive information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up Free</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your account in seconds. No credit card required. Start with our free plan and upgrade anytime.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Your Contacts</h3>
              <p className="text-gray-600 leading-relaxed">
                Import or manually add your clients. Organize contacts with tags and categories for easy management.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create & Send Invoices</h3>
              <p className="text-gray-600 leading-relaxed">
                Generate professional invoices, send them to clients, and track payments all from one dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that works best for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Up to 10 invoices/month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Basic invoice templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Contact management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Payment tracking</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full text-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-500 relative transform scale-105">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">For growing businesses</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Unlimited invoices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Project & timesheet management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">For large teams</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Multi-user access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Role-based permissions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated support</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full text-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                About Invoice Hub
              </h2>
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                Invoice Hub was born from the frustration of small business owners who struggled with complex invoicing systems. We believe invoicing should be simple, fast, and stress-free.
              </p>
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                Our mission is to empower businesses of all sizes with tools that help them get paid faster, manage their finances better, and focus on what they do best - running their business.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Built with modern technology and designed with user experience in mind, Invoice Hub combines powerful features with an intuitive interface that anyone can use.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">User-Focused Design</h3>
                    <p className="text-gray-600">Every feature is designed with your needs in mind.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CloudArrowUpIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cloud-Based</h3>
                    <p className="text-gray-600">Access your invoices from anywhere, anytime.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Reliable</h3>
                    <p className="text-gray-600">Your data is protected with enterprise-grade security.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Invoice Hub
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Is Invoice Hub free to use?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes! We offer a free plan that includes up to 10 invoices per month, basic templates, and contact management. Perfect for small businesses just getting started.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Can I customize my invoices?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Absolutely! You can customize invoice templates with your logo, colors, and branding. Pro and Enterprise plans include advanced customization options.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                How do I track payments?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                You can record payments directly in the system, mark invoices as paid, and view payment history. Our dashboard shows you all outstanding invoices and payment status at a glance.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Can I convert quotes to invoices?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes! Create quotes for your clients, and when they're ready, convert them to invoices with just one click. All quote details are automatically transferred.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Security is our top priority. We use encryption, secure servers, and follow industry best practices to protect your data. Enterprise plans include additional security features and compliance options.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Can multiple users access the same account?
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Yes, our Enterprise plan supports multiple users with role-based access control. You can assign different permissions to team members, ensuring everyone has the right level of access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Simplify Your Invoicing?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust Invoice Hub to manage their invoicing. Get started today - it's free!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started For Free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">IH</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Invoice Hub</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Designed by: The Invoice Hub Team
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-600">
              <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

