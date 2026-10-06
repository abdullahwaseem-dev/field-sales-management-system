# Security policy

Please report security issues privately to **maw112266@gmail.com** (subject: "SFMS security") rather than
opening a public issue. Include steps to reproduce; you'll get a reply within three working days.

The public demo at zona-sfms-demo.vercel.app runs on a separate database with simulated data. Please
don't run load tests or automated scanners against it.

## How SFMS protects data

- Passwords hashed with Argon2id; short-lived access tokens; refresh tokens rotate and are bound to one device
- Accounts are created only by the administrator; repeated wrong passwords lock the account
- Location is collected only between check-in and check-out — enforced by a database trigger, not just the app
- Attendance history and the audit log are append-only; the audit log is hash-chained so tampering is detectable
- Verified TLS to the database; row-level security blocks the hosting provider's auto-generated data API
- Map-provider keys stay on the server (tiles are proxied); secrets live in environment variables, never in the repo
