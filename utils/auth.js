import { ERROR_MESSAGES } from '#constants/error-messages';

async function requireJwtAuth(request, reply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
  }
}

export { requireJwtAuth };
