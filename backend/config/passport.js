const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const db = require("./db"); // your database

let usersColumnsPromise;

async function getUsersColumns() {
  if (!usersColumnsPromise) {
    usersColumnsPromise = db
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        return new Set(rows.map((row) => row.Field));
      })
      .catch((error) => {
        // Avoid caching a rejected promise forever after transient DB failures.
        usersColumnsPromise = null;
        const dbDetails =
          error?.code && error?.sqlMessage
            ? `${error.code}: ${error.sqlMessage}`
            : error?.code || error?.message || "Unknown database error";
        throw new Error(
          `Unable to read users table schema. Check MySQL service and users table. ${dbDetails}`
        );
      });
  }
  return usersColumnsPromise;
}

async function upsertOAuthUser({ name, email, googleId = null, githubId = null }) {
  const columns = await getUsersColumns();
  const idField = googleId ? "google_id" : "github_id";
  const idValue = googleId || githubId;
  const nameField = columns.has("name")
    ? "name"
    : columns.has("full_name")
      ? "full_name"
      : null;

  if (!columns.has(idField)) {
    throw new Error(`Missing users.${idField} column. Add it in your database schema.`);
  }
  if (!nameField) {
    throw new Error("Missing users.name/full_name column. Add one to your database schema.");
  }

  let [rows] = await db.query(
    `SELECT * FROM users WHERE ${idField} = ?`,
    [idValue]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  if (email) {
    [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      const user = rows[0];
      await db.query(
        `UPDATE users SET ${idField} = ? WHERE id = ?`,
        [idValue, user.id]
      );
      return { ...user, [idField]: idValue };
    }
  }

  const insertFields = [nameField, "email"];
  const insertValues = [name, email];
  if (columns.has("password")) {
    insertFields.push("password");
    // OAuth users do not have a local password by default.
    insertValues.push("");
  }
  if (columns.has("google_id")) {
    insertFields.push("google_id");
    insertValues.push(googleId);
  }
  if (columns.has("github_id")) {
    insertFields.push("github_id");
    insertValues.push(githubId);
  }

  const placeholders = insertFields.map(() => "?").join(", ");
  const [result] = await db.query(
    `INSERT INTO users (${insertFields.join(", ")}) VALUES (${placeholders})`,
    insertValues
  );

  return {
    id: result.insertId,
    name,
    email,
    google_id: googleId,
    github_id: githubId
  };
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await upsertOAuthUser({
          name: profile.displayName,
          email: profile.emails?.[0]?.value || null,
          googleId: profile.id
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

const githubStrategyOptions = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  scope: ["user:email"]
};

passport.use(
  new GitHubStrategy(
    githubStrategyOptions,
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.find((entry) => entry.verified)?.value ||
          profile.emails?.[0]?.value ||
          `${profile.username || `github_${profile.id}`}@users.noreply.github.com`;
        const user = await upsertOAuthUser({
          name: profile.displayName || profile.username,
          email,
          githubId: profile.id
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  let [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  done(null, rows[0]);
});

module.exports = passport;
