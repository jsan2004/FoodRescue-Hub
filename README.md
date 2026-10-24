# Food Donation and Expiry Management System for NGOs & Community Organisations

A centralized, full-stack web platform engineered to eliminate food waste and address community food insecurity in India through real-time donor-NGO matching, automated expiry-time management, verified volunteer dispatch, and audited beneficiary reporting.

---

## 🚀 How to Run the Project

### 1. Run Backend Server:
```bash
cd server
npm start
# Runs on http://localhost:5000
```
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 2. Run Frontend Web App:
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Reset / Re-seed Database (with Indian entities):
```bash
cd server
node src/utils/seedData.js
```

---

## 🔑 Login Accounts (Pre-Seeded Indian Context)

Sign in through the standard login page (`/login`) with any of the following accounts:

| Role | Email | Password | Organization / Name | Details & Location |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Administrator** | `admin@foodaid.in` | `admin123` | System Administrator | Verifies DARPAN NGO registrations, audits donations, views national impact analytics |
| 🏢 **Verified NGO** | `rotibank@ngo.in` | `ngo123` | Roti Bank Seva Foundation | Verified DARPAN charity (`DARPAN-KA-2022-04812`), Koramangala, Bengaluru |
| 🏢 **Pending NGO** | `akshaya@ngo.in` | `ngo123` | Akshaya Annadanam Trust | Awaiting Admin verification approval, Bandra West, Mumbai |
| 🍽️ **Food Donor** | `annapoorna@donor.in` | `donor123` | Annapoorna Caterers & Restaurant | Posts surplus banquet food, passes 4-point safety checklist, Indiranagar, Bengaluru |
| 🥐 **Food Donor 2** | `iyengar.bakery@donor.in` | `donor123` | Iyengar Sweets & Traditional Bakery | Lists fresh bread, bun maska & puff surplus, Commercial Street, Bengaluru |
| 🚴 **Volunteer** | `rohan.volunteer@seva.in` | `vol123` | Rohan Iyer | Verified field volunteer for Koramangala & Indiranagar areas, Bengaluru |
| 🚴 **Volunteer 2** | `ananya.volunteer@seva.in` | `vol123` | Ananya Deshmukh | Verified field volunteer for Bandra & Dadar areas, Mumbai |

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 (Vite)
  - Tailwind CSS v4
  - Lucide React Icons
  - Real-time ticking countdown clock engine (second-by-second updates)
- **Backend**:
  - Node.js (v24) + Express.js REST API
  - JWT Authentication & Role-Based Middleware guards
  - Automated background expiry checker (runs every 60s)
- **Database**:
  - Relational SQLite with disk persistence (`food_donation.db`)
  - 100% relational schema matching Section 8 of the research proposal; easily exportable to MySQL/PostgreSQL.

---

## 📊 Core Features & Differentiators

### 1. Dynamic Expiry & Urgency Engine
- 🟢 **Fresh**: More than 4 hours remaining before safety deadline.
- 🟡 **Expiring Soon**: 2 to 4 hours remaining.
- 🔴 **Urgent (< 2 Hours)**: Live pulsing badge with countdown clock (`01h 24m 18s`) prioritizing immediate NGO collection.
- ⚫ **Auto-Expiry Worker**: Automatically marks unclaimed listings as `Expired` once the safety deadline passes.

### 2. 4-Point Food Safety Verification Checklist
Donors must confirm all 4 standards before publishing:
1. Food covered and protected from dust/contaminants.
2. Clean, food-grade storage containers used.
3. Temperature adherence (hot food held > 63°C, chilled items < 5°C).
4. Safe consumption window respected.

### 3. Visual 5-Stage Status Stepper
Live pipeline tracking across 5 transparent states:
`Posted` ➔ `Accepted` ➔ `Volunteer Assigned` ➔ `Picked Up` ➔ `Delivered`

### 4. Beneficiary & Impact Audit
- NGOs and volunteers log the exact number of individuals fed upon delivery confirmation.
- Public community impact dashboard shows live meals served, kg rescued from landfills, and active partner charities.

### 5. MSc Research Evaluation Suite (Dissertation Section 10)
- Built-in empirical stopwatch tool comparing:
  - **Scenario A**: Manual phone/WhatsApp/spreadsheet coordination.
  - **Scenario B**: Our centralized digital system.
- Logs completion times, error counts, and generates comparison tables for **Dissertation Chapter 6 (Results and Evaluation)**.

---

## 📁 Project Structure

```
food-donation-system/
├── server/
│   ├── food_donation.db             # Persisted SQLite database
│   ├── src/
│   │   ├── config/database.js       # SQLite connection & table schema
│   │   ├── controllers/             # Auth, Donations, NGO, Volunteer, Admin, Evaluation
│   │   ├── middleware/              # JWT & role verification guards
│   │   ├── routes/api.js            # REST API endpoints
│   │   ├── services/expiryService.js# Background cron & urgency calculator
│   │   ├── utils/seedData.js        # Seed script for demo accounts & trials
│   │   └── server.js                # Express entrypoint
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/              # Navbar, CountdownBadge, StatusStepper, FoodSafetyModal
│   │   ├── context/AuthContext.jsx  # Global session state
│   │   ├── pages/                   # Home, Login, Register, Donor, NGO, Volunteer, Admin, Evaluation
│   │   ├── services/api.js          # Centralized API client
│   │   ├── App.jsx                  # React Router & role guards
│   │   └── index.css                # Tailwind styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```
