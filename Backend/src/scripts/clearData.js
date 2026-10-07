/**
 * EventForge Database Purge Script
 * Cleans all seeded mock records from the database to leave a pristine environment for production deployment.
 */
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Venue = require('../models/Venue');
const Speaker = require('../models/Speaker');
const Event = require('../models/Event');
const EventMember = require('../models/EventMember');
const Announcement = require('../models/Announcement');
const GlobalPolicy = require('../models/GlobalPolicy');
const Session = require('../models/Session');
const TicketType = require('../models/TicketType');
const Coupon = require('../models/Coupon');
const Registration = require('../models/Registration');
const SessionAttendance = require('../models/SessionAttendance');
const SponsorPackage = require('../models/SponsorPackage');
const Sponsorship = require('../models/Sponsorship');
const Deliverable = require('../models/Deliverable');
const Feedback = require('../models/Feedback');
const AiLog = require('../models/AiLog');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');

const clearDatabase = async () => {
  // eslint-disable-next-line no-console
  console.log('🧹 Purging all existing collections and seed records...');

  try {
    await connectDB();

    const collections = [
      { name: 'Deliverables', model: Deliverable },
      { name: 'SessionAttendances', model: SessionAttendance },
      { name: 'Registrations', model: Registration },
      { name: 'Coupons', model: Coupon },
      { name: 'TicketTypes', model: TicketType },
      { name: 'Sessions', model: Session },
      { name: 'Feedback', model: Feedback },
      { name: 'Sponsorships', model: Sponsorship },
      { name: 'SponsorPackages', model: SponsorPackage },
      { name: 'Announcements', model: Announcement },
      { name: 'EventMembers', model: EventMember },
      { name: 'Events', model: Event },
      { name: 'Speakers', model: Speaker },
      { name: 'Venues', model: Venue },
      { name: 'Organizations', model: Organization },
      { name: 'AiLogs', model: AiLog },
      { name: 'AuditLogs', model: AuditLog },
      { name: 'RefreshTokens', model: RefreshToken },
      { name: 'Users', model: User },
      { name: 'GlobalPolicies', model: GlobalPolicy },
    ];

    for (const { name, model } of collections) {
      const res = await model.deleteMany({});
      // eslint-disable-next-line no-console
      console.log(`  ✓ Cleared ${name}: ${res.deletedCount} documents removed`);
    }

    // Initialize baseline production platform policy
    await GlobalPolicy.create({
      key: 'platform_settings',
      value: {
        maintenanceMode: false,
        allowPublicRegistrations: true,
        defaultEventCapacityLimit: 10000,
        allowedFileUploadMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maxUploadSizeBytes: 10 * 1024 * 1024,
      },
      description: 'Platform operational flags and security parameters',
      updatedBy: null,
    });
    // eslint-disable-next-line no-console
    console.log('  ✓ Initialized default platform_settings policy');

    // eslint-disable-next-line no-console
    console.log('\n✅ Database successfully cleared! All demo & seed data removed.');
    // eslint-disable-next-line no-console
    console.log('💡 Tip: The first user to register via /register will automatically become Platform Admin.');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to clear database:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;
