import authController from '#controllers/auth.controller';
import {
  loginAuthSchema,
  logoutAuthSchema,
  refreshAuthSchema,
  registerAuthSchema,
} from '#schemas/auth.schema';
import { requireJwtAuth } from '#utils/auth';

async function authRoutes(fastify) {
  fastify.post(
    '/auth/register',
    { schema: registerAuthSchema },
    authController.register
  );
  fastify.post(
    '/auth/login',
    { schema: loginAuthSchema },
    authController.login
  );
  fastify.post(
    '/auth/refresh',
    { schema: refreshAuthSchema },
    authController.refresh
  );
  fastify.post(
    '/auth/logout',
    {
      onRequest: requireJwtAuth,
      schema: logoutAuthSchema,
    },
    authController.logout
  );
}

export default authRoutes;
