const userRepository = require('../repositories/user.repository');
const formatter = require('../utils/formatter');
const rolesMap = require('../data/roles.json');

const getPublicUsers = async () => {
  const users = await userRepository.findAll();

  return users.map((u) => ({
    id: u.id,
    name: formatter.formatName(u.name),
    roleName: rolesMap[u.role] || 'Unknown'
  }));
};

module.exports = {
  getPublicUsers
};