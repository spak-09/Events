/**
 * EventForge Admin Creation CLI Script
 * Use this script to provision or promote a Platform SuperAdmin in production.
 *
 * Usage:
 *   node src/scripts/createAdmin.js <email> <password> [name]
 *   Or via environment variables:
 *   INITIAL_ADMIN_EMAIL=admin@company.com INITIAL_ADMIN_PASSWORD=Secret! node src/scripts/createAdmin.js
 */
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { GLOBAL_ROLES } = require('../config/roles');

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args[1] || process.env.INITIAL_ADMIN_PASSWORD || '';
  const name = args[2] || process.env.INITIAL_ADMIN_NAME || 'Platform Administrator';

  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error('❌ Usage: node src/scripts/createAdmin.js <email> <password> [name]');
    // eslint-disable-next-line no-console
    console.error('   Or set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in environment.');
    process.exit(1);
  }

  if (password.length < 8) {
    // eslint-disable-next-line no-console
    console.error('❌ Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();

    let user = await User.findOne({ email });
    const passwordHash = await User.hashPassword(password);

    if (user) {
      user.globalRole = GLOBAL_ROLES.PLATFORM_ADMIN;
      user.passwordHash = passwordHash;
      user.isActive = true;
      if (name) user.name = name;
      await user.save();
      // eslint-disable-next-line no-console
      console.log(`✅ Existing user "${email}" updated and promoted to PLATFORM_ADMIN.`);
    } else {
      user = await User.create({
        name,
        email,
        passwordHash,
        globalRole: GLOBAL_ROLES.PLATFORM_ADMIN,
        isActive: true,
      });
      // eslint-disable-next-line no-console
      console.log(`✅ New Platform SuperAdmin user created: "${email}".`);
    }

    await AuditLog.create({
      user: user._id,
      action: 'ADMIN_PROVISIONED',
      resource: 'User',
      resourceId: user._id.toString(),
      details: { email, role: GLOBAL_ROLES.PLATFORM_ADMIN },
    });

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to provision admin:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;
