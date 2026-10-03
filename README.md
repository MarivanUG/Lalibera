# Lalibera Classic Motel

Modernized website for Lalibera Classic Motel, Mukono, Uganda.

## Stack
- Node.js + Express
- EJS templates
- Responsive CSS
- Nodemailer booking/contact delivery
- Basic-auth protected content administration

## Local setup
1. Copy `.env.example` to `.env`.
2. Fill in the admin and SMTP credentials.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Production notes
- Never commit the real `.env` file.
- Set a strong `ADMIN_PASSWORD`.
- Configure valid SMTP credentials before enabling the contact form.
- Place the app behind HTTPS in production.

The previous static export is retained on the `legacy-static-backup-2026-10-03` branch.
