# League of Tech — Affordable Tech, Unbeatable Prices!

A full-stack eCommerce web app with:
- **Frontend**: React (Vite), responsive UI, light/dark mode, filters, live search, wishlist, compare, cart, checkout
- **Backend**: Node.js + Express + MongoDB (Mongoose), JWT auth, admin product management with image upload (Multer)
- **Payment**: Dummy gateway (sandbox endpoint) for demo
- **SEO & Performance**: semantic HTML, lazy images, code-splitting, cache-friendly static assets

## Quick Start

### 1) Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 2) Backend setup
```bash
cd server
cp .env.example .env
# Edit .env to set MONGO_URI and JWT_SECRET
npm install
npm run seed   # seed sample users/products
npm run dev    # runs on http://localhost:5000
```

### 3) Frontend setup
```bash
cd client
npm install
npm run dev    # runs on http://localhost:5173
```
Vite dev server is configured to proxy `/api` to `http://localhost:5000`.

### 4) Default Accounts
- **Admin**: admin@leagueoftech.com / Admin@1234
- **User**: user@leagueoftech.com / User@1234

### 5) Admin Product Listing Page
Login as Admin → Navigate to **/admin** to add products (name, description, price in Taka, keywords, image upload with preview).

### 6) Notes
- Images uploaded by admin are saved to `server/uploads` and served at `/uploads/...`.
- Sample product images live in `client/public/images`.
- Contact email: **contact.leagueoftech@gmail.com**
- Brand: **League of Tech** — *Affordable Tech, Unbeatable Prices!*

---

## Scripts

**Server**
- `npm run dev` — nodemon watch
- `npm start` — production start
- `npm run seed` — seed database

**Client**
- `npm run dev` — vite dev
- `npm run build` — production build
- `npm run preview` — preview build

---

## Folder Structure

```
league-of-tech/
  server/           # Express API + MongoDB
  client/           # React + Vite UI
```

Enjoy!
