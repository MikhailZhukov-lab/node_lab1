import { describe, expect, it, vi } from 'vitest';
import { ERROR_MESSAGES } from '../../constants/error-messages.js';
import { requireJwtAuth } from '../../utils/auth.js';

describe('requireJwtAuth', () => {
  it('allows request when jwt verification succeeds', async () => {
    const request = {
      jwtVerify: vi.fn(async () => {}),
    };
    const reply = {
      unauthorized: vi.fn(),
    };

    await requireJwtAuth(request, reply);

    expect(request.jwtVerify).toHaveBeenCalled();
    expect(reply.unauthorized).not.toHaveBeenCalled();
  });

  it('returns unauthorized response when jwt verification fails', async () => {
    const request = {
      jwtVerify: vi.fn(async () => {
        throw new Error('bad token');
      }),
    };
    const reply = {
      unauthorized: vi.fn(() => ERROR_MESSAGES.UNAUTHORIZED),
    };

    const result = await requireJwtAuth(request, reply);

    expect(reply.unauthorized).toHaveBeenCalledWith(
      ERROR_MESSAGES.UNAUTHORIZED
    );
    expect(result).toBe(ERROR_MESSAGES.UNAUTHORIZED);
  });
});
