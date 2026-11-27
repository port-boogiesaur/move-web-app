// Fields that are safe to send to the browser. Never include passwordHash.
const safeUser = {
  select: {
    id: true,
    name: true,
    email: true,
    profilePicture: true,
    bio: true,
  },
};

module.exports = safeUser;
