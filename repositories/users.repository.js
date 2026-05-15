import { eq } from 'drizzle-orm';
import { users } from '#db/schema';

function createUsersRepository(db) {
  const create = async (payload) => {
    const result = await db.insert(users).values(payload).$returningId();

    return findById(result[0]?.id ?? null);
  };

  const findByEmail = async (email) => {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return rows[0] ?? null;
  };

  const findById = async (id) => {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return rows[0] ?? null;
  };

  return {
    create,
    findByEmail,
    findById,
  };
}

export { createUsersRepository };
