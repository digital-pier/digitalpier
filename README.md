# Digital Pier Website

Marketing website for Digital Pier, built as a Node.js + Express static site.

## Run locally

```bash
npm install
npm start
```

The app uses `PORT` from the environment and defaults to `3000`.

## Contact form setup (SMTP)

Set these environment variables in Hostinger for the form to send email:

- `SMTP_HOST`
- `SMTP_PORT` (usually `465` for SSL or `587` for TLS)
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_FROM_EMAIL` (sender address)
- `CONTACT_TO_EMAIL` (where leads are delivered)

The form submits to `POST /api/contact`.

## Deploy on Hostinger Node.js

1. Upload this project to your Hostinger Node.js app directory.
2. Set the startup file/command to:
   - `server.js` or `npm start`
3. Ensure Node.js version is 18+.
4. Install dependencies on the server:
   - `npm install`
5. Start or restart the app from Hostinger panel.
