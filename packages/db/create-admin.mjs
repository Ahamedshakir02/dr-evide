// Creates (or resets the password of) an admin who can sign in at /admin.
//
//   DATABASE_URL=... npm run admin:create -- --email you@example.com --name "Your Name"
//
// The password is read from ADMIN_PASSWORD if set, otherwise prompted for with
// echo off, so it never lands in shell history. There is no sign-up page:
// this script is the only way an admin account comes into existence.
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCb);
// Must match apps/web/src/lib/admin-auth.ts.
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "").trim() : "";
};
const email = arg("email").toLowerCase();
const name = arg("name");
const disable = args.includes("--disable");

if (!email || (!name && !disable)) {
  console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name"');
  console.error("       npm run admin:create -- --email you@example.com --disable");
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) {
    console.error("Set ADMIN_PASSWORD, or run this in a terminal to be prompted.");
    process.exit(1);
  }
  const ask = (prompt) =>
    new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      let buf = "";
      const onData = (ch) => {
        const c = ch.toString("utf8");
        if (c === "\r" || c === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(buf);
        } else if (c === "\u0003") process.exit(130);
        else if (c === "\u007f") buf = buf.slice(0, -1);
        else buf += c;
      };
      process.stdin.on("data", onData);
    });
  const a = await ask("Password: ");
  const b = await ask("Again: ");
  if (a !== b) {
    console.error("The passwords did not match.");
    process.exit(1);
  }
  return a;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

if (disable) {
  const { rowCount } = await client.query(
    `UPDATE admin_users SET disabled = true WHERE lower(email) = $1`,
    [email]
  );
  await client.query(
    `DELETE FROM admin_sessions WHERE admin_id IN (SELECT id FROM admin_users WHERE lower(email) = $1)`,
    [email]
  );
  console.log(rowCount ? `Disabled ${email} and signed them out.` : `No admin ${email}.`);
  await client.end();
  process.exit(rowCount ? 0 : 1);
}

const password = await readPassword();
if (password.length < 12) {
  console.error("Use at least 12 characters. A passphrase of four words is fine.");
  await client.end();
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scrypt(password, salt, 64, SCRYPT);
const hash = ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");

const { rows } = await client.query(
  `INSERT INTO admin_users (email, name, password_hash) VALUES ($1, $2, $3)
   ON CONFLICT (lower(email)) DO UPDATE
     SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, disabled = false
   RETURNING id, (xmax = 0) AS created`,
  [email, name, hash]
);
// A password reset ends every existing session for that account.
if (!rows[0].created) {
  await client.query(`DELETE FROM admin_sessions WHERE admin_id = $1`, [rows[0].id]);
}
await client.end();
console.log(rows[0].created ? `Created admin ${email}.` : `Reset the password for ${email}.`);
