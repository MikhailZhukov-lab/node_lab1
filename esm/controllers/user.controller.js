import { increment } from '../state/request-counter.js';
import * as userRepository from '../repositories/user.repository.js';
import { getPublicUsers } from '../services/user.service.js';

const getUsers = async (request, reply) => {
  increment();

  const users = await getPublicUsers();
  return { users };
};

const getUserById = async (request, reply) => {
  increment();

  const { id } = request.params;
  const user = await userRepository.findById(id);

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return { user };
};

export default {
  getUsers,
  getUserById
};