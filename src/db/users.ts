import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  // Use upsert to handle concurrent inserts of the same user ID safely.
  // Updates email if the user already exists, or inserts a new record.
  const result = await db.insert(users)
    .values({
      uid,
      email,
      name: name || null,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        ...(name ? { name } : {}),
      },
    })
    .returning();

  return result[0];
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("Database query failed:", error);
    // Sanitize error to avoid leaking internal connection or schema details
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
