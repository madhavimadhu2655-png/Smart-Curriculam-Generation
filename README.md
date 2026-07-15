<div align="center">

# 🏦 SecureBank
### Complete Digital Banking Platform

*A full-stack payment app inspired by PhonePe, Google Pay & Paytm*

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

<p>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
</p>

<p>
<img src="https://img.shields.io/badge/JWT-Auth-black?style=flat-square&logo=jsonwebtokens"/>
<img src="https://img.shields.io/badge/Pages-43-blueviolet?style=flat-square"/>
<img src="https://img.shields.io/badge/Languages-10%20Indian-orange?style=flat-square"/>
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square"/>
</p>

</div>

<br/>

## ✨ What's Inside

| | | |
|---|---|---|
| 💸 **UPI Transfers** | 👛 **Digital Wallet** | 📈 **Investments** — MF, Gold, FD |
| 🧾 **Bill Payments** — Mobile, DTH, Electricity & more | 🤖 **AI Assistant** (Claude-powered) | 🛡️ **Fraud Detection Engine** |
| 🌗 **Dark / Light Mode** | 🌐 **10 Indian Languages** | 🧑‍💼 **Admin Dashboard** |

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## ⚡ Quick Start

> Get up and running in **3 steps** — should take under 5 minutes.

### 1️⃣ Backend Setup

```bash
cd securebank-complete/backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in your real values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/banking_db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
JWT_EXPIRY=2h
FRONTEND_URL=http://localhost:5173
LARGE_TRANSFER_THRESHOLD=10000
FRAUD_LARGE_THRESHOLD=5000
LOG_LEVEL=info
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start the server:

```bash
npm run dev
```

> ✅ **Expected output**
> ```
> MongoDB connected: cluster0.xxxxx.mongodb.net
> SecureBank v2.0 running on port 5000 [development]
> ```

---

### 2️⃣ Frontend Setup

Open a **new terminal window**:

```bash
cd securebank-complete/frontend
npm install
cp .env.example .env.local
```

Default value is already correct for local dev:

```env
VITE_API_URL=http://localhost:5000/api
```

Start it up:

```bash
npm run dev
```

> ✅ **Expected output**
> ```
> VITE v5.x  ready in 300ms
> ➜  Local:   http://localhost:5173/
> ```

---

### 3️⃣ Open in Browser

Go to **http://localhost:5173**, register an account, and you're in. 🎉

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## 🔑 Make Yourself Admin

1. Register a normal account first
2. In **MongoDB Atlas → Collections → banking_db → users**, open the Atlas Shell and run:

```js
use banking_db
db.users.updateOne(
  { email: "youremail@example.com" },
  { $set: { role: "admin" } }
)
```

3. Log out, log back in → you'll land on the **Admin Dashboard**

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## 📁 Project Structure

<details>
<summary><b>Click to expand full file tree</b></summary>

```
securebank-complete/
├── backend/                         Node.js + Express API
│   ├── config/database.js           MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        Register, Login, JWT
│   │   ├── transactionController.js Atomic UPI transfers
│   │   ├── adminController.js       Admin management
│   │   ├── walletController.js      Digital wallet
│   │   ├── investmentController.js  MF, Gold, FD
│   │   └── billsController.js       Bill payments
│   ├── middleware/
│   │   ├── auth.js                  JWT verify + RBAC
│   │   ├── rateLimiter.js           Per-route rate limits
│   │   └── validators.js            Input validation
│   ├── models/
│   │   ├── User.js                  User schema + bcrypt
│   │   ├── Transaction.js           Payment records
│   │   ├── Log.js                   Audit trail
│   │   ├── Wallet.js                Digital wallet
│   │   └── Investment.js            MF / Gold / FD
│   ├── routes/
│   │   ├── auth.js                  /api/auth/*
│   │   ├── user.js                  /api/user/*
│   │   ├── transaction.js           /api/transactions/*
│   │   ├── admin.js                 /api/admin/*
│   │   ├── wallet.js                /api/wallet/*
│   │   ├── investments.js           /api/investments/*
│   │   └── bills.js                 /api/bills/*
│   ├── services/
│   │   ├── fraudDetection.js        4-rule fraud engine
│   │   └── notificationService.js   OTP + notifications
│   ├── utils/
│   │   ├── logger.js                Winston logger
│   │   └── auditLogger.js           DB audit writer
│   ├── server.js                    Main entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/                        React + Vite + Tailwind
    ├── src/
    │   ├── App.jsx                  All routes (43 pages)
    │   ├── main.jsx                 React entry point
    │   ├── index.css                Tailwind + custom styles
    │   ├── context/
    │   │   ├── AuthContext.jsx      JWT + session timeout
    │   │   ├── ThemeContext.jsx     Dark/light mode
    │   │   └── LanguageContext.jsx  10 Indian languages
    │   ├── services/api.js          Axios + all APIs
    │   ├── components/common/
    │   │   ├── Layout.jsx           Responsive sidebar
    │   │   └── LoadingSpinner.jsx
    │   └── pages/ (43 pages)
    │       Core:    UPIDashboard, UPISendPage, QRScannerPage
    │       Bills:   MobileRecharge, CreditCard, Electricity,
    │                Water, Gas, DTH, Broadband, MetroCard,
    │                Flights, Hotels
    │       Easy:    BankAccounts, Analytics, Notifications,
    │                Profile, Favourites, Receipt, Repeat,
    │                Language, Contacts
    │       Medium:  Rewards, SplitBill, MerchantPay, AutoPay,
    │                NearbyMap, EMI, Tickets, Insurance
    │       Hard:    Wallet, MutualFunds, DigitalGold, BNPL,
    │                AIAssistant, UPILite, FD
    │       Admin:   Dashboard, Users, Alerts
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env.example
```

</details>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## 🌐 API Reference

<details>
<summary><b>🔐 Auth</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Log in, receive JWT |
| `GET` | `/api/auth/me` | Get current session user |

</details>

<details>
<summary><b>👤 User</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Fetch profile |
| `GET` | `/api/user/balance` | Fetch balance |
| `PUT` | `/api/user/profile` | Update profile |

</details>

<details>
<summary><b>💸 Transactions</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transactions/transfer` | Send money (atomic) |
| `POST` | `/api/transactions/request-otp` | Request OTP for transfer |
| `GET` | `/api/transactions/history` | Transaction history |

</details>

<details>
<summary><b>👛 Wallet</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/wallet` | Get wallet details |
| `POST` | `/api/wallet/add` | Add money |
| `POST` | `/api/wallet/send` | Send from wallet |
| `POST` | `/api/wallet/withdraw` | Withdraw to bank |

</details>

<details>
<summary><b>📈 Investments</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/investments` | List investments |
| `POST` | `/api/investments/mutual-fund` | Invest in mutual fund |
| `POST` | `/api/investments/gold` | Buy digital gold |
| `POST` | `/api/investments/fd` | Open fixed deposit |
| `POST` | `/api/investments/fd/:id/break` | Break FD early |

</details>

<details>
<summary><b>🧾 Bills</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bills/fetch` | Fetch pending bills |
| `POST` | `/api/bills/recharge` | Mobile recharge |
| `POST` | `/api/bills/electricity` | Pay electricity bill |
| `POST` | `/api/bills/credit-card` | Pay credit card bill |
| `POST` | `/api/bills/generic` | Generic bill payment |

</details>

<details>
<summary><b>🧑‍💼 Admin</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin overview |
| `GET` | `/api/admin/users` | List users |
| `PUT` | `/api/admin/users/:id/suspend` | Suspend a user |
| `GET` | `/api/admin/transactions` | All transactions |
| `GET` | `/api/admin/alerts` | Fraud alerts |
| `PUT` | `/api/admin/transactions/:id/resolve` | Resolve flagged transaction |

</details>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## 🔒 Security Features

| Feature | Detail |
|---|---|
| 🔐 Password hashing | bcrypt, 12 salt rounds |
| 🎫 Authentication | JWT, 2h expiry |
| 🚫 Brute-force protection | Account lockout after 5 failed attempts |
| 🛡️ Security headers | Helmet.js |
| 🧹 Injection protection | MongoDB sanitization |
| ⏱️ Rate limiting | Relaxed in dev, strict in production |
| ⚛️ Data integrity | Atomic transactions via MongoDB sessions |
| 🕵️ Fraud detection | 4-rule scoring engine |
| 📜 Audit trail | Full history logged to database |

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## 🚀 Deploy to Production

<table>
<tr>
<th>🎨 Frontend → Vercel</th>
<th>⚙️ Backend → Render</th>
<th>🍃 MongoDB → Atlas</th>
</tr>
<tr>
<td valign="top">

```bash
cd frontend
npm run build
# Upload dist/ to Vercel
```
Set env var:
`VITE_API_URL=https://your-backend.onrender.com/api`

</td>
<td valign="top">

- Connect your GitHub repo
- Build: `cd backend && npm install`
- Start: `node server.js`
- Add all `.env` variables
- Set `NODE_ENV=production`

</td>
<td valign="top">

- Free **M0** cluster works fine
- Network Access → allow `0.0.0.0/0`
- Copy connection string into `MONGO_URI`

</td>
</tr>
</table>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" height="4">

## 💡 Tips & Troubleshooting

> 🖥️ Keep **both terminals open** (backend + frontend) while using the app
> 🔄 Restart backend: type `rs` + Enter in the nodemon terminal, or `Ctrl+C` then `npm run dev`
> ⏳ Seeing **"Too many requests"** in dev? Restart the backend — it clears the in-memory rate limiter
> 🤖 The **AI Assistant** runs on the Claude API — works automatically once you're logged in
> 🌗 **Dark mode** toggle lives in the sidebar, bottom-left

<br/>

<div align="center">

**Built with ❤️ using React, Node.js & MongoDB**

⭐ If this project helped you, consider starring the repo!

</div>
