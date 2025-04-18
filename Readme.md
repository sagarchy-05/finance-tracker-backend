# 💸 Personal Finance Tracker

A full-stack web application that helps users manage their income and expenses, track budgets, gain insights into spending habits, and visualize financial trends.

---

## 🌐 Live Demo


👉 [View the App](https://track-your-own-finances.vercel.app/)

---

## 📦 Features

### 🔐 User Authentication

- JWT-based login and signup
- CAPTCHA protection to prevent abuse
- Email verification support (via Nodemailer)

### 💰 Transactions

- Add income and expense transactions
- Categorize transactions (e.g., Food, Transport, Shopping)
- Edit and delete entries
- Track descriptions, dates, and amounts

### 📊 Budgets

- Set monthly category-wise budgets
- Real-time tracking of spending against limits
- Get notified when limits are exceeded

### 🤖 AI-Powered Insights

- Utilizes Hugging Face's Falcon-7B model
- Generates personalized financial advice based on recent transactions
- Insights are:
  - Concise
  - Actionable
  - Category-aware
  - Avoid generic repetition

### 📈 Data Visualization

Supports multiple chart APIs to power visual dashboards on the frontend:

- **Category-wise Totals**: Breakdown of expenses by category
- **Monthly Trends**: See how your spending evolves over months
- **Budget vs Actual**: View your spending against limits for each category
- **Daily Summary**: Expense activity across days

### 🛡️ Security and Performance

- Input validation and sanitization
- Rate limiting for sensitive routes
- Secure password hashing with bcrypt
- CORS-enabled for secure frontend-backend interaction

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite (coming soon)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **AI Integration**: Hugging Face (Falcon-7B)
- **Authentication**: JWT + Nodemailer
- **Deployment**: Vercel (Frontend), Render/Fly.io (Backend)

---

## 👤 Author

Built with ❤️ by Sagar
