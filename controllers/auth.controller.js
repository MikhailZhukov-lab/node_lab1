import authService from '#services/auth.service';
import { ERROR_MESSAGES } from '#constants/error-messages';

const refreshCookieName = 'refreshToken';

function buildRefreshCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: false,
  };
}

const register = async (request, reply) => {
  const user = await authService.register(request.body);

  return reply.status(201).send(user);
};

const login = async (request, reply) => {
  const user = await authService.login(request.body);
  const { accessToken, refreshToken } = await authService.issueTokens(user);

  reply.setCookie(refreshCookieName, refreshToken, buildRefreshCookieOptions());

  return reply.status(200).send({
    accessToken,
    user,
  });
};

const refresh = async (request, reply) => {
  const refreshToken = request.cookies?.[refreshCookieName];

  if (!refreshToken) {
    return reply.unauthorized(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  const result = await authService.refresh(refreshToken);

  return reply.status(200).send(result);
};

const logout = async (request, reply) => {
  const authorizationHeader = request.headers.authorization ?? '';
  const accessToken = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : null;

  await authService.logout({
    accessToken,
    accessTokenPayload: request.user,
    refreshToken: request.cookies?.[refreshCookieName] ?? null,
  });

  reply.clearCookie(refreshCookieName, {
    path: '/',
  });

  return reply.status(204).send();
};

export default {
  login,
  logout,
  refresh,
  register,
};
