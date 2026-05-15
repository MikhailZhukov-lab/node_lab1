import authService from '#services/auth.service';

const register = async (request, reply) => {
  const user = await authService.register(request.body);

  return reply.status(201).send(user);
};

const login = async (request, reply) => {
  const user = await authService.login(request.body);
  request.session.user = user;

  return reply.status(200).send(user);
};

const logout = async (request, reply) => {
  await request.session.destroy();

  return reply.status(204).send();
};

export default {
  login,
  logout,
  register,
};
