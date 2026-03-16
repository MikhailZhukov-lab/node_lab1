import * as userRepository from '../repositories/user.repository.js';
import formatter from '../utils/formatter.js';
import rolesMap from '../data/roles.json' with { type: 'json' };

export const getPublicUsers = async () => {
    const users = await userRepository.findAll();

    return users.map((u) => ({
        id: u.id,
        name: formatter.formatName(u.name),
        roleName: rolesMap[u.role] || 'Unknown'
    }));
};