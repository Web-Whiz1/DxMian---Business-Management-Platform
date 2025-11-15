# 🚀 DxMian - Business Management SaaS Platform

<div align="center">

![DxMian](https://img.shields.io/badge/DxMian-Business%20Management-blue?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.57.4-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)

**A modern, full-stack SaaS platform for managing appointments, customers, services, staff, and payments for local businesses.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Documentation](#-documentation) • [Deployment](#-deployment)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Demo](#-demo)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🎯 About

**DxMian** is a comprehensive business management platform designed to help local businesses streamline their operations. Whether you run a restaurant, gym, salon, spa, or clinic, DxMian provides all the tools you need to manage appointments, customers, staff, and payments in one place.

### Key Highlights

- ✨ **Modern UI/UX** - Beautiful, responsive design built with Tailwind CSS
- 🔒 **Secure** - Row Level Security (RLS) for data isolation
- 🚀 **Fast** - Built with Vite for lightning-fast development
- 📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Customizable** - Easy to brand and customize for your needs
- 🔐 **Production Ready** - Fully tested and ready to deploy

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure user authentication with Supabase Auth
- Role-based access control (Business Owner, Staff)
- Email verification for business owners
- Staff invite system with secure token-based registration

### 🏢 Business Management
- Complete business profile setup
- Support for multiple business types (Restaurant, Gym, Salon, Spa, Clinic, etc.)
- Business hours configuration
- Customizable booking settings

### 👥 Customer Management
- Full CRUD operations for customers
- Customer tags and notes
- Purchase history tracking
- Last visit tracking
- Advanced search functionality

### 💼 Service Management
- Create and manage service offerings
- Service pricing and duration
- Service categories
- Active/inactive status toggle
- Service assignment to staff

### 📅 Booking Management
- Create, edit, and delete bookings
- Multiple booking statuses (Pending, Confirmed, Completed, Cancelled, No Show)
- Booking search and filtering
- Automatic payment record creation
- Customer visit tracking

### 👨‍💼 Staff Management
- Add and manage staff members
- Staff service assignments
- Active/inactive status
- Staff invite link generation
- Staff profile management

### 💳 Payment Tracking
- Payment history and status tracking
- Revenue summaries
- Payment status management
- Integration ready for Stripe

### 📊 Analytics Dashboard
- Revenue trends and statistics
- Booking analytics
- Customer insights
- Visual charts and graphs

### ⚙️ Settings
- Profile management
- Business settings
- Booking preferences
- Notification preferences

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.5.3** - Type safety
- **Vite 5.4.2** - Build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Chart library for analytics

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 🎬 Demo

### Live Demo
🔗 [View Live Demo](https://your-demo-link.com) *(Add your deployed link here)*

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign up for free](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dxmian.git
   cd dxmian
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Get these values from your Supabase project:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **Settings** → **API**
   - Copy **Project URL** → `VITE_SUPABASE_URL`
   - Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

4. **Set up the database**
   
   **Option A: Using Supabase CLI (Recommended)**
   ```bash
   # Install Supabase CLI globally (if not already installed)
   npm install -g supabase
   
   # Login to Supabase
   npx supabase login
   
   # Link to your project
   npx supabase link --project-ref your-project-ref
   
   # Push migrations
   npx supabase db push
   ```
   
   **Option B: Manual Setup via Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Run migrations from `supabase/migrations/` in order:
     1. `20251031111736_create_core_schema.sql`
     2. `20250101000001_fix_rls_no_recursion.sql`
     3. `20250101000002_add_notification_preferences.sql`
     4. `20250101000003_auto_create_user_profile.sql`
     5. `20250101000004_create_staff_invites.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### First Steps

1. **Register a new account** as a Business Owner
2. **Set up your business profile** (name, type, contact info)
3. **Add services** you offer
4. **Add customers** to your database
5. **Create bookings** for appointments
6. **Invite staff members** using the invite system

---

## 📁 Project Structure

```
dxmian/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── DashboardLayout.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useRouter.ts
│   ├── lib/                # Utilities and configurations
│   │   ├── supabase.ts
│   │   ├── database.types.ts
│   │   └── supabase-test.ts
│   ├── pages/              # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Bookings.tsx
│   │   ├── Customers.tsx
│   │   ├── Services.tsx
│   │   ├── Staff.tsx
│   │   ├── Payments.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── supabase/
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase config
├── .env.example            # Environment variables template
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ Yes |

### Tailwind Configuration

Customize colors, fonts, and other design tokens in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
      },
    },
  },
}
```

### Supabase Configuration

Database configuration is managed through migrations in `supabase/migrations/`. Each migration file contains SQL statements that modify the database schema.

---

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts and authentication
- **businesses** - Business profiles and settings
- **customers** - Customer database with tags and notes
- **services** - Service offerings with pricing
- **bookings** - Appointment bookings with status tracking
- **payments** - Payment transactions and history
- **staff** - Staff member profiles and assignments
- **staff_invites** - Staff invitation tokens
- **business_hours** - Operating hours configuration
- **booking_settings** - Booking preferences and rules

### Security

- **Row Level Security (RLS)** enabled on all tables
- **Business-level data isolation** - Users can only access their business data
- **Role-based access control** - Different permissions for owners and staff

### Relationships

```
businesses (1) ──→ (many) customers
businesses (1) ──→ (many) services
businesses (1) ──→ (many) bookings
businesses (1) ──→ (many) staff
customers (1) ──→ (many) bookings
services (1) ──→ (many) bookings
bookings (1) ──→ (1) payments
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **"New Project"**
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Add environment variables**
   - In project settings → **Environment Variables**
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click **"Deploy"**
   - Your app will be live at `your-project.vercel.app`

5. **Update Supabase CORS**
   - Go to Supabase Dashboard → **Settings** → **API**
   - Add your Vercel URL to **Allowed CORS Origins**

### Netlify

1. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment variables**
   - Add in Netlify dashboard → **Site settings** → **Environment variables**

3. **Deploy**
   - Connect your GitHub repository
   - Netlify will auto-deploy on push

### Other Platforms

The app can be deployed to any platform supporting static sites:

- **GitHub Pages** - Free hosting for public repos
- **AWS Amplify** - AWS hosting solution
- **Cloudflare Pages** - Fast global CDN
- **Railway** - Simple deployment platform
- **Render** - Modern cloud platform

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🧪 Testing

### Run Type Checking
```bash
npm run typecheck
```

### Run Linter
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly

---

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type check TypeScript |

---

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch" error**
- ✅ Check `.env` file has correct Supabase credentials
- ✅ Verify Supabase project is active
- ✅ Check browser console for detailed errors

**RLS Policy Errors**
- ✅ Ensure all migrations have been applied
- ✅ Check RLS policies in Supabase dashboard
- ✅ See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed fixes

**Database Connection Issues**
- ✅ Verify Supabase URL and keys are correct
- ✅ Check Supabase project status
- ✅ Ensure database migrations are applied

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**DxMian Dev (dxmian dev)**

- 🌐 Website: [Your Portfolio URL](https://yourportfolio.com)
- 💼 LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- 🐙 GitHub: [@Web-Whiz1](https://github.com/Web-Whiz1)
- 📧 Email: dxmian.dev@gmail.com

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Amazing backend platform
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Lucide](https://lucide.dev) - Beautiful icon library
- [Vite](https://vitejs.dev) - Next generation frontend tooling
- [React](https://react.dev) - UI library

---

## 📊 Project Status

✅ **Production Ready** - All core features implemented and tested

### ✅ Completed Features
- User authentication and authorization
- Business setup and management
- Customer CRUD operations
- Service management
- Booking management
- Staff management with invite system
- Payment tracking
- Analytics dashboard
- Settings management
- Responsive design
- Error handling
- Email verification
- Staff invite links

### 🚧 Future Enhancements
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Stripe payment integration
- [ ] Calendar view for bookings
- [ ] Customer portal
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced reporting
- [ ] API documentation

---

## 📈 Roadmap

- [x] Core authentication system
- [x] Business management
- [x] Customer management
- [x] Service management
- [x] Booking system
- [x] Staff management
- [x] Payment tracking
- [x] Analytics dashboard
- [ ] Email notifications
- [ ] Payment gateway integration
- [ ] Mobile app

---

<div align="center">

**Made with ❤️ by DxMian Dev**

⭐ Star this repo if you find it helpful!

[⬆ Back to Top](#-dxmian---business-management-saas-platform)

</div>


