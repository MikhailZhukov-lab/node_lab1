import authController from '#controllers/auth.controller';
import {
  loginAuthSchema,
  logoutAuthSchema,
  registerAuthSchema,
} from '#schemas/auth.schema';

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
    '/auth/logout',
    { schema: logoutAuthSchema },
    authController.logout
  );
}

export default authRoutes;
