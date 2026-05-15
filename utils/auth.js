import { ERROR_MESSAGES } from '#constants/error-messages';

async function requireSession(request, reply) {
  if (request.session?.user?.id) {
    return;
  }

  return reply.unauthorized(ERROR_MESSAGES.UNAUTHORIZED);
}

export { requireSession };
