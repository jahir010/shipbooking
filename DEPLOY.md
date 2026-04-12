# Deployment Guide

This project is deploy-ready for a free setup with:

- Frontend: Vercel Hobby
- Backend: Render Free Web Service
- Database: TiDB Cloud Starter

## 1. Prepare secrets

Before deploying, rotate any secrets currently stored in `backend/.env`, especially:

- `EMAIL_HOST_PASSWORD`
- `SSLCOMMERZ_STORE_PASSWORD`

Then keep only the rotated values in your hosting dashboards, not in git.

## 2. Create a free TiDB Cloud database

1. Create a TiDB Cloud Starter cluster.
2. In the cluster dashboard, open `Connect`.
3. Copy the public MySQL connection string.
4. Create a database named `shipbooking` if it is not already included in the connection string.
5. Add a firewall rule that allows your backend host to connect.

Use the copied connection string as `DATABASE_URL` in Render.

Example:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:4000/shipbooking?ssl=true
```

## 3. Deploy the FastAPI backend on Render

1. Push this repo to GitHub.
2. In Render, create a new `Blueprint` or `Web Service` from the repo.
3. If you use the blueprint, Render will read [`render.yaml`](./render.yaml).
4. Set these environment variables for the backend:

```env
DATABASE_URL=your_tidb_connection_string
APP_URL=https://your-frontend-domain.vercel.app
API_PUBLIC_BASE_URL=https://your-render-service.onrender.com/api
BACKEND_CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_SANDBOX_MODE=True
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email_user
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=noreply@example.com
```

Render service settings:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

After the first deploy, open:

- `https://your-render-service.onrender.com/`

You should see:

```json
{"message":"Ship Booking API"}
```

## 4. Deploy the Next.js frontend on Vercel

1. Import the same GitHub repo into Vercel.
2. Keep the project root as the repository root.
3. Add this environment variable:

```env
NEXT_PUBLIC_API_BASE=https://your-render-service.onrender.com/api
```

4. Deploy.

## 5. Final production values to revisit

After both apps are live, update the backend values if your final frontend URL changes:

- `APP_URL`
- `BACKEND_CORS_ORIGINS`

If you use SSLCommerz, also make sure its dashboard callback URLs match your live backend:

- `https://your-render-service.onrender.com/api/payments/sslcommerz/success`
- `https://your-render-service.onrender.com/api/payments/sslcommerz/fail`
- `https://your-render-service.onrender.com/api/payments/sslcommerz/cancel`

## 6. Free-tier notes

- Render free web services sleep after inactivity, so the backend can be slow on the first request.
- TiDB Cloud Starter is free within its Starter quota.
- Vercel Hobby is free for personal projects.
- SMTP and payment callbacks should be tested after deploy because provider restrictions can vary by platform.
