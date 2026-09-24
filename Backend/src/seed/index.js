const mongoose = require('mongoose');
const env = require('../config/env');
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

const { usersSeed, organizationsSeed, venuesSeed, speakersSeed } = require('./seedData');
const { EVENT_ROLES, EVENT_STATUS, REGISTRATION_STATUS, DELIVERABLE_STATUS } = require('../config/roles');

const runSeed = async () => {
  // eslint-disable-next-line no-console
  console.log('🌱 Starting EventForge Comprehensive Database Seed Process...');

  try {
    await connectDB();

    // 1. Clear existing collections
    // eslint-disable-next-line no-console
    console.log('🧹 Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Venue.deleteMany({}),
      Speaker.deleteMany({}),
      Event.deleteMany({}),
      EventMember.deleteMany({}),
      Announcement.deleteMany({}),
      GlobalPolicy.deleteMany({}),
      Session.deleteMany({}),
      TicketType.deleteMany({}),
      Coupon.deleteMany({}),
      Registration.deleteMany({}),
      SessionAttendance.deleteMany({}),
      SponsorPackage.deleteMany({}),
      Sponsorship.deleteMany({}),
      Deliverable.deleteMany({}),
      Feedback.deleteMany({}),
      AiLog.deleteMany({}),
    ]);

    // 2. Seed Base Key Users
    // eslint-disable-next-line no-console
    console.log(`👤 Seeding base system users...`);
    const defaultPasswordHash = await User.hashPassword('Password123!');
    const createdUsers = [];
    for (const u of usersSeed) {
      const user = await User.create({
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        globalRole: u.globalRole,
        phone: u.phone,
        isActive: true,
        isEmailVerified: true,
      });
      createdUsers.push(user);
    }

    const adminUser = createdUsers[0];
    const organizerAcme = createdUsers[1];
    const organizerGlobal = createdUsers[2];
    const staff1 = createdUsers[3];
    const staff2 = createdUsers[4];
    const sponsorUser1 = createdUsers[5];
    const sampleAttendee = createdUsers[6];

    // Seed 2 additional sponsor rep users
    const sponsorUser2 = await User.create({
      name: 'David Vector (VectorDB Rep)',
      email: 'sponsor@vectordb.com',
      passwordHash: defaultPasswordHash,
      globalRole: 'user',
      phone: '+1-555-0107',
    });

    const sponsorUser3 = await User.create({
      name: 'Dr. Rachel Vance (NeuralMetrics Rep)',
      email: 'sponsor@neuralmetrics.ai',
      passwordHash: defaultPasswordHash,
      globalRole: 'user',
      phone: '+1-555-0108',
    });

    // Seed ~200 Attendee Users in bulk
    // eslint-disable-next-line no-console
    console.log('👥 Generating 200 diverse conference attendee profiles...');
    const attendeeDocs = [];
    const attendeeInterestsPool = [
      'LLM', 'Inference', 'Autonomous Agents', 'MLOps', 'Robotics',
      'AI Safety', 'Fine-Tuning', 'Vector Databases', 'Computer Vision',
      'Prompt Engineering', 'Reinforcement Learning', 'Cloud Infrastructure'
    ];

    for (let i = 1; i <= 200; i++) {
      const padIndex = String(i).padStart(3, '0');
      attendeeDocs.push({
        name: `Attendee ${padIndex} (${['Dev', 'Research', 'Founder', 'Engineer', 'Architect', 'Scientist'][i % 6]})`,
        email: `attendee${i}@eventforge-network.io`,
        passwordHash: defaultPasswordHash,
        globalRole: 'user',
        phone: `+1-555-2${padIndex}`,
        isActive: true,
        isEmailVerified: true,
      });
    }
    const createdAttendees = await User.insertMany(attendeeDocs);
    const allAttendees = [sampleAttendee, ...createdAttendees];

    // 3. Seed Organizations
    // eslint-disable-next-line no-console
    console.log(`🏢 Seeding ${organizationsSeed.length} organizations...`);
    const createdOrgs = await Organization.insertMany(organizationsSeed);
    const orgAcme = createdOrgs[0];
    const orgGlobal = createdOrgs[1];

    // 4. Seed Venues
    // Ensure Javits Center has sufficient rooms for 20 parallel/staggered sessions
    venuesSeed[1].rooms = [
      { name: 'Grand Ballroom', capacity: 2500, floor: 'Level 3', amenities: ['Surround Sound', 'LED Video Wall'] },
      { name: 'Tech Pavilion', capacity: 500, floor: 'Level 1', amenities: ['Booth Power', 'A/V Setup'] },
      { name: 'Breakout Hall A', capacity: 250, floor: 'Level 2', amenities: ['Whiteboards', 'Microphones'] },
      { name: 'Workshop Lab 1', capacity: 100, floor: 'Level 4', amenities: ['LAN Station', 'Dual Screens'] },
    ];

    // eslint-disable-next-line no-console
    console.log(`📍 Seeding ${venuesSeed.length} venues with expanded multi-room layouts...`);
    const createdVenues = await Venue.insertMany(venuesSeed);
    const venueMoscone = createdVenues[0];
    const venueJavits = createdVenues[1];
    const venueExcel = createdVenues[2];

    // 5. Seed Speakers
    // eslint-disable-next-line no-console
    console.log(`🎤 Seeding ${speakersSeed.length} keynote and breakout speakers...`);
    const createdSpeakers = await Speaker.insertMany(speakersSeed);

    // 6. Seed Events (Past, Live, Upcoming)
    // eslint-disable-next-line no-console
    console.log('📅 Seeding 3 multi-day events (Past, Live, Upcoming)...');
    const now = new Date();
    const liveStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 0, 0);
    const liveEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 20, 0, 0);

    const eventsToCreate = [
      {
        org: orgAcme._id,
        title: 'Tech Summit 2025',
        slug: 'tech-summit-2025',
        description: 'The retrospective annual engineering conference focused on scalable architectures.',
        category: 'Engineering',
        tags: ['architecture', 'microservices', 'scale'],
        startDate: new Date('2025-10-10T09:00:00Z'),
        endDate: new Date('2025-10-12T17:00:00Z'),
        timezone: 'America/Los_Angeles',
        venue: venueMoscone._id,
        status: EVENT_STATUS.COMPLETED,
        banner: '/uploads/sample-banner-techsummit.jpg',
        capacity: 2500,
        createdBy: organizerAcme._id,
      },
      {
        org: orgGlobal._id,
        title: 'AI World Congress 2026',
        slug: 'ai-world-congress-2026',
        description: 'The premier international conference on generative AI, autonomous agents, and foundation models.',
        category: 'Artificial Intelligence',
        tags: ['AI', 'LLM', 'Agents', 'MLOps', 'Inference'],
        startDate: liveStart,
        endDate: liveEnd,
        timezone: 'America/New_York',
        venue: venueJavits._id,
        status: EVENT_STATUS.LIVE,
        banner: '/uploads/sample-banner-aiworld.jpg',
        capacity: 4000,
        policies: {
          refundPolicy: '50% refund up to 7 days before event.',
          codeOfConduct: 'Zero tolerance for harassment or discrimination.',
          ageRestriction: 18,
          privacyPolicy: 'Sessions may be recorded and broadcast live.',
        },
        createdBy: organizerGlobal._id,
      },
      {
        org: orgAcme._id,
        title: 'Cloud & DevOps Expo 2026',
        slug: 'cloud-devops-expo-2026',
        description: 'Next-generation cloud infrastructure, Kubernetes, and automated platform engineering.',
        category: 'DevOps & Cloud',
        tags: ['cloud', 'kubernetes', 'devops', 'gitops'],
        startDate: new Date(now.getTime() + 30 * 86400000),
        endDate: new Date(now.getTime() + 33 * 86400000),
        timezone: 'Europe/London',
        venue: venueExcel._id,
        status: EVENT_STATUS.PUBLISHED,
        banner: '/uploads/sample-banner-cloudexpo.jpg',
        capacity: 3500,
        createdBy: organizerAcme._id,
      },
    ];

    const createdEvents = await Event.insertMany(eventsToCreate);
    const pastEvent = createdEvents[0];
    const liveEvent = createdEvents[1];
    const upcomingEvent = createdEvents[2];

    // 7. Seed Event Memberships (Dual-Layer RBAC)
    // eslint-disable-next-line no-console
    console.log('👥 Assigning dual-layer RBAC event memberships...');
    await EventMember.insertMany([
      { user: organizerAcme._id, event: pastEvent._id, role: EVENT_ROLES.ORGANIZER, status: 'active' },
      { user: staff1._id, event: pastEvent._id, role: EVENT_ROLES.STAFF, status: 'active' },

      { user: organizerGlobal._id, event: liveEvent._id, role: EVENT_ROLES.ORGANIZER, status: 'active' },
      { user: staff1._id, event: liveEvent._id, role: EVENT_ROLES.STAFF, status: 'active' },
      { user: staff2._id, event: liveEvent._id, role: EVENT_ROLES.STAFF, status: 'active' },
      { user: sponsorUser1._id, event: liveEvent._id, role: EVENT_ROLES.SPONSOR, status: 'active' },
      { user: sponsorUser2._id, event: liveEvent._id, role: EVENT_ROLES.SPONSOR, status: 'active' },
      { user: sponsorUser3._id, event: liveEvent._id, role: EVENT_ROLES.SPONSOR, status: 'active' },

      { user: organizerAcme._id, event: upcomingEvent._id, role: EVENT_ROLES.ORGANIZER, status: 'active' },
      { user: staff2._id, event: upcomingEvent._id, role: EVENT_ROLES.STAFF, status: 'active' },
    ]);

    // 8. Seed Ticket Types for Live Event
    // eslint-disable-next-line no-console
    console.log('🎫 Generating tiered ticket types (with capacity constraints & approvals)...');
    const ticketTypes = await TicketType.insertMany([
      {
        event: liveEvent._id,
        name: 'VIP Platinum Pass',
        price: 599,
        capacity: 40,
        sold: 35,
        salesWindow: {
          start: new Date(liveStart.getTime() - 30 * 86400000),
          end: liveEnd,
        },
        requiresApproval: false,
      },
      {
        event: liveEvent._id,
        name: 'General Conference Pass',
        price: 249,
        capacity: 150,
        sold: 140,
        salesWindow: {
          start: new Date(liveStart.getTime() - 45 * 86400000),
          end: liveEnd,
        },
        requiresApproval: false,
      },
      {
        event: liveEvent._id,
        name: 'Academic & Student Pass',
        price: 49,
        capacity: 40,
        sold: 25,
        salesWindow: {
          start: new Date(liveStart.getTime() - 45 * 86400000),
          end: liveEnd,
        },
        requiresApproval: false,
      },
      {
        event: liveEvent._id,
        name: 'Executive AI Roundtable (Approval Required)',
        price: 0,
        capacity: 20,
        sold: 10,
        salesWindow: {
          start: new Date(liveStart.getTime() - 60 * 86400000),
          end: liveEnd,
        },
        requiresApproval: true,
      },
    ]);

    const vipTicket = ticketTypes[0];
    const generalTicket = ticketTypes[1];
    const studentTicket = ticketTypes[2];
    const execTicket = ticketTypes[3];

    // 9. Seed Coupons
    // eslint-disable-next-line no-console
    console.log('🎟️ Seeding promotional coupons (% and flat discounts)...');
    const coupons = await Coupon.insertMany([
      {
        event: liveEvent._id,
        code: 'AIWORLD20',
        type: 'percent',
        value: 20,
        maxUses: 100,
        used: 28,
        expiry: new Date(liveEnd.getTime() + 7 * 86400000),
        ticketTypes: [vipTicket._id, generalTicket._id],
        isActive: true,
      },
      {
        event: liveEvent._id,
        code: 'SAVE50FLAT',
        type: 'flat',
        value: 50,
        maxUses: 50,
        used: 12,
        expiry: new Date(liveEnd.getTime() + 7 * 86400000),
        ticketTypes: [vipTicket._id, generalTicket._id],
        isActive: true,
      },
      {
        event: liveEvent._id,
        code: 'EXPIRED10',
        type: 'percent',
        value: 10,
        maxUses: 20,
        used: 5,
        expiry: new Date(liveStart.getTime() - 5 * 86400000), // expired
        ticketTypes: [],
        isActive: true,
      },
      {
        event: liveEvent._id,
        code: 'MAXEDOUT',
        type: 'flat',
        value: 100,
        maxUses: 5,
        used: 5, // fully consumed
        expiry: new Date(liveEnd.getTime() + 7 * 86400000),
        ticketTypes: [],
        isActive: true,
      },
    ]);
    const validCoupon = coupons[0];

    // 10. Seed 20 Conflict-Free Scheduled Agenda Sessions
    // eslint-disable-next-line no-console
    console.log('🗓️ Scheduling 20 conflict-free agenda sessions across 4 rooms and 5 time blocks...');
    const rooms = ['Grand Ballroom', 'Tech Pavilion', 'Breakout Hall A', 'Workshop Lab 1'];
    const sessionSpecs = [
      // Day 1 Slot 1: 09:30 - 10:30
      { title: 'Opening Keynote: The Dawn of Agentic Intelligence', room: rooms[0], offsetHoursStart: 1.5, offsetHoursEnd: 2.5, capacity: 2000, track: 'Foundation Models', tags: ['AI', 'LLM', 'Agents'], speakerIndex: 0 },
      { title: 'Ultra-Fast LLM Inference with Speculative Decoding', room: rooms[1], offsetHoursStart: 1.5, offsetHoursEnd: 2.5, capacity: 450, track: 'Inference', tags: ['Inference', 'vLLM', 'GPU'], speakerIndex: 1 },
      { title: 'Vector Database Benchmarks at Billion-Scale', room: rooms[2], offsetHoursStart: 1.5, offsetHoursEnd: 2.5, capacity: 200, track: 'MLOps', tags: ['Vector Databases', 'Search'], speakerIndex: 2 },
      { title: 'Hands-on Lab: Fine-Tuning Llama 3 on Custom Datasets', room: rooms[3], offsetHoursStart: 1.5, offsetHoursEnd: 2.5, capacity: 80, track: 'Engineering', tags: ['Fine-Tuning', 'PyTorch'], speakerIndex: 3 },

      // Day 1 Slot 2: 11:00 - 12:30
      { title: 'Architecting Multi-Agent Coordination Frameworks', room: rooms[0], offsetHoursStart: 3.0, offsetHoursEnd: 4.5, capacity: 1800, track: 'Autonomous Agents', tags: ['Agents', 'Automation'], speakerIndex: 1 },
      { title: 'Distributed Training: From 1k to 10k H100 Clusters', room: rooms[1], offsetHoursStart: 3.0, offsetHoursEnd: 4.5, capacity: 450, track: 'MLOps', tags: ['Cloud Infrastructure', 'Scale'], speakerIndex: 2 },
      { title: 'Prompt Optimization & DSPy in Production Systems', room: rooms[2], offsetHoursStart: 3.0, offsetHoursEnd: 4.5, capacity: 220, track: 'Engineering', tags: ['Prompt Engineering', 'LLM'], speakerIndex: 3 },
      { title: 'Lab: Building Local Offline RAG with Ollama', room: rooms[3], offsetHoursStart: 3.0, offsetHoursEnd: 4.5, capacity: 80, track: 'Engineering', tags: ['Vector Databases', 'Inference'], speakerIndex: 0 },

      // Day 1 Slot 3: 14:00 - 15:30
      { title: 'Panel: Aligning Superintelligence & Safety Guarantees', room: rooms[0], offsetHoursStart: 6.0, offsetHoursEnd: 7.5, capacity: 1500, track: 'AI Safety', tags: ['AI Safety', 'Ethics'], speakerIndex: 2 },
      { title: 'Edge AI: Running Quantized Models on Mobile & NPU', room: rooms[1], offsetHoursStart: 6.0, offsetHoursEnd: 7.5, capacity: 400, track: 'Inference', tags: ['Inference', 'Robotics'], speakerIndex: 3 },
      { title: 'Zero-Copy Data Pipelines for Continuous Model Eval', room: rooms[2], offsetHoursStart: 6.0, offsetHoursEnd: 7.5, capacity: 200, track: 'MLOps', tags: ['MLOps', 'Pipelines'], speakerIndex: 0 },
      { title: 'Lab: Evaluation Metrics and Red Teaming LLMs', room: rooms[3], offsetHoursStart: 6.0, offsetHoursEnd: 7.5, capacity: 80, track: 'AI Safety', tags: ['AI Safety', 'Fine-Tuning'], speakerIndex: 1 },

      // Day 1 Slot 4: 16:00 - 17:30
      { title: 'Multimodal Architectures: Unifying Vision, Speech & Logic', room: rooms[0], offsetHoursStart: 8.0, offsetHoursEnd: 9.5, capacity: 1800, track: 'Foundation Models', tags: ['Computer Vision', 'LLM'], speakerIndex: 3 },
      { title: 'Memory-Augmented Cognitive Architectures in Practice', room: rooms[1], offsetHoursStart: 8.0, offsetHoursEnd: 9.5, capacity: 420, track: 'Autonomous Agents', tags: ['Agents', 'Vector Databases'], speakerIndex: 0 },
      { title: 'Production Incident Response in AI Systems: Postmortems', room: rooms[2], offsetHoursStart: 8.0, offsetHoursEnd: 9.5, capacity: 200, track: 'MLOps', tags: ['MLOps', 'Reliability'], speakerIndex: 1 },
      { title: 'Lab: Graph RAG and Knowledge Representation', room: rooms[3], offsetHoursStart: 8.0, offsetHoursEnd: 9.5, capacity: 80, track: 'Engineering', tags: ['Search', 'Graph'], speakerIndex: 2 },

      // Day 2 Slot 5: 10:00 - 11:30
      { title: 'The Next Frontier: Embodied AI and Humanoid Robotics', room: rooms[0], offsetHoursStart: 26.0, offsetHoursEnd: 27.5, capacity: 2200, track: 'Robotics', tags: ['Robotics', 'Agents'], speakerIndex: 0 },
      { title: 'Constitutional AI and Automated Guardrails', room: rooms[1], offsetHoursStart: 26.0, offsetHoursEnd: 27.5, capacity: 450, track: 'AI Safety', tags: ['AI Safety', 'Ethics'], speakerIndex: 1 },
      { title: 'Kubernetes Operators for Elastic GPU Orchestration', room: rooms[2], offsetHoursStart: 26.0, offsetHoursEnd: 27.5, capacity: 220, track: 'MLOps', tags: ['Cloud Infrastructure', 'Kubernetes'], speakerIndex: 2 },
      { title: 'Closing Roundtable: Where AI Architecture Goes in 2027', room: rooms[3], offsetHoursStart: 26.0, offsetHoursEnd: 27.5, capacity: 80, track: 'Foundation Models', tags: ['Strategy', 'LLM'], speakerIndex: 3 },
    ];

    const sessionDocs = sessionSpecs.map((spec) => {
      const start = new Date(liveStart.getTime() + spec.offsetHoursStart * 3600000);
      const end = new Date(liveStart.getTime() + spec.offsetHoursEnd * 3600000);
      const speakerId = createdSpeakers[spec.speakerIndex % createdSpeakers.length]._id;

      return {
        event: liveEvent._id,
        title: spec.title,
        description: `In-depth exploration of ${spec.title} with industry case studies, practical benchmarks, and Q&A.`,
        room: spec.room,
        start,
        end,
        speakers: [speakerId],
        track: spec.track,
        tags: spec.tags,
        capacity: spec.capacity,
        status: 'confirmed',
      };
    });

    const createdSessions = await Session.insertMany(sessionDocs);

    // 11. Seed Sponsor Packages, Sponsorships & Deliverables
    // eslint-disable-next-line no-console
    console.log('💎 Provisioning 3 sponsor tiers, allocating packages, and generating deliverables...');
    const packages = await SponsorPackage.insertMany([
      {
        event: liveEvent._id,
        tier: 'platinum',
        name: 'Platinum Visionary Partner',
        price: 25000,
        benefits: ['Keynote co-presentation', 'Premium 20x20 Booth', 'VIP Dinner Host', 'App Banner'],
        slots: 2,
        claimed: 1,
      },
      {
        event: liveEvent._id,
        tier: 'gold',
        name: 'Gold Innovation Partner',
        price: 12000,
        benefits: ['Breakout session host', '10x10 Booth', 'Lanyard Logo', '5 VIP Passes'],
        slots: 4,
        claimed: 1,
      },
      {
        event: liveEvent._id,
        tier: 'silver',
        name: 'Silver Ecosystem Partner',
        price: 5000,
        benefits: ['Expo Hall Kiosk', 'Website Logo', '2 Conference Passes'],
        slots: 6,
        claimed: 1,
      },
    ]);

    const platinumPkg = packages[0];
    const goldPkg = packages[1];
    const silverPkg = packages[2];

    const sponsorships = await Sponsorship.insertMany([
      {
        event: liveEvent._id,
        sponsor: sponsorUser1._id,
        package: platinumPkg._id,
        companyName: 'CloudScale IO',
        companyLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
        status: 'confirmed',
      },
      {
        event: liveEvent._id,
        sponsor: sponsorUser2._id,
        package: goldPkg._id,
        companyName: 'VectorDB Labs',
        companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
        status: 'confirmed',
      },
      {
        event: liveEvent._id,
        sponsor: sponsorUser3._id,
        package: silverPkg._id,
        companyName: 'NeuralMetrics AI',
        companyLogo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200',
        status: 'confirmed',
      },
    ]);

    const sp1 = sponsorships[0];
    const sp2 = sponsorships[1];
    const sp3 = sponsorships[2];

    await Deliverable.insertMany([
      // CloudScale IO Deliverables (Platinum)
      {
        event: liveEvent._id,
        sponsorship: sp1._id,
        title: 'High-Resolution Vector Logo (SVG / EPS)',
        description: 'Transparent background for main stage display screens.',
        dueDate: new Date(liveStart.getTime() - 10 * 86400000),
        status: DELIVERABLE_STATUS.APPROVED,
        asset: 'https://cdn.eventforge.com/assets/cloudscale_logo.svg',
        submittedAt: new Date(liveStart.getTime() - 12 * 86400000),
        reviewedAt: new Date(liveStart.getTime() - 11 * 86400000),
        reviewNotes: 'Verified vector format and transparent boundary.',
      },
      {
        event: liveEvent._id,
        sponsorship: sp1._id,
        title: 'Keynote Presentation Slide Deck (16:9 4K)',
        description: 'Provide PPTX or PDF before tech rehearsal.',
        dueDate: new Date(liveStart.getTime() - 2 * 86400000),
        status: DELIVERABLE_STATUS.SUBMITTED,
        asset: 'https://cdn.eventforge.com/assets/cloudscale_keynote_final.pdf',
        submittedAt: new Date(liveStart.getTime() - 1 * 86400000),
      },
      {
        event: liveEvent._id,
        sponsorship: sp1._id,
        title: 'Custom Swag Bag Insert Proof',
        description: 'Double-sided printed voucher specification.',
        dueDate: new Date(liveStart.getTime() + 1 * 86400000),
        status: DELIVERABLE_STATUS.PENDING,
      },

      // VectorDB Labs Deliverables (Gold)
      {
        event: liveEvent._id,
        sponsorship: sp2._id,
        title: 'Expo Booth Backdrop Artwork (3m x 2.4m)',
        dueDate: new Date(liveStart.getTime() - 5 * 86400000),
        status: DELIVERABLE_STATUS.APPROVED,
        asset: 'https://cdn.eventforge.com/assets/vectordb_booth_print.pdf',
        submittedAt: new Date(liveStart.getTime() - 6 * 86400000),
        reviewedAt: new Date(liveStart.getTime() - 5 * 86400000),
        reviewNotes: 'Print specs approved by booth fabrication team.',
      },
      {
        event: liveEvent._id,
        sponsorship: sp2._id,
        title: '30-Second Commercial Promo Video (1080p)',
        dueDate: new Date(liveStart.getTime() - 1 * 86400000),
        status: DELIVERABLE_STATUS.SUBMITTED,
        asset: 'https://cdn.eventforge.com/assets/vectordb_promo_reel.mp4',
        submittedAt: new Date(liveStart.getTime() - 2 * 86400000),
      },

      // NeuralMetrics AI Deliverables (Silver)
      {
        event: liveEvent._id,
        sponsorship: sp3._id,
        title: 'Company Profile & Web Hyperlink',
        dueDate: new Date(liveStart.getTime() - 7 * 86400000),
        status: DELIVERABLE_STATUS.APPROVED,
        asset: 'https://neuralmetrics.ai/about',
        submittedAt: new Date(liveStart.getTime() - 8 * 86400000),
        reviewedAt: new Date(liveStart.getTime() - 7 * 86400000),
        reviewNotes: 'Profile live on conference partners page.',
      },
    ]);

    // 12. Seed ~200 Multi-Status Registrations
    // Breakdown: 90 checked_in, 70 approved, 25 waitlisted, 10 pending approval, 5 cancelled
    // eslint-disable-next-line no-console
    console.log('📝 Creating 200 realistic registrations across all lifecycle statuses...');
    const registrationDocs = [];

    for (let i = 0; i < allAttendees.length; i++) {
      const attendee = allAttendees[i];
      let status;
      let waitlistPosition = null;
      let checkedInAt = null;
      let checkedInBy = null;
      let targetTicket;
      let couponUsed = null;
      let finalPrice;

      // Assign ticket type
      if (i < 35) {
        targetTicket = vipTicket;
      } else if (i < 155) {
        targetTicket = generalTicket;
      } else if (i < 185) {
        targetTicket = studentTicket;
      } else {
        targetTicket = execTicket;
      }

      // Assign realistic lifecycle statuses
      if (i < 90) {
        // 90 checked_in attendees
        status = REGISTRATION_STATUS.CHECKED_IN;
        checkedInAt = new Date(liveStart.getTime() + (i % 8) * 1800000 + 15 * 60000);
        checkedInBy = (i % 2 === 0 ? staff1 : staff2)._id;
      } else if (i < 160) {
        // 70 approved attendees
        status = REGISTRATION_STATUS.APPROVED;
      } else if (i < 185) {
        // 25 waitlisted
        status = REGISTRATION_STATUS.WAITLISTED;
        waitlistPosition = i - 159; // 1 to 25
      } else if (i < 195) {
        // 10 pending approval
        status = REGISTRATION_STATUS.PENDING;
      } else {
        // 5 cancelled
        status = REGISTRATION_STATUS.CANCELLED;
      }

      // Coupon application logic
      if (i % 5 === 0 && status !== REGISTRATION_STATUS.PENDING) {
        couponUsed = validCoupon._id;
        finalPrice = Math.round(targetTicket.price * 0.8);
      } else {
        finalPrice = targetTicket.price;
      }

      // Pick 2-4 randomized interests
      const interests = [
        attendeeInterestsPool[i % attendeeInterestsPool.length],
        attendeeInterestsPool[(i + 3) % attendeeInterestsPool.length],
        attendeeInterestsPool[(i + 7) % attendeeInterestsPool.length],
      ];

      // Pick 2-4 selected sessions
      const selectedSessions = [
        createdSessions[i % 4]._id,
        createdSessions[4 + (i % 4)]._id,
        createdSessions[8 + (i % 4)]._id,
      ];

      const qrToken = `qr_aiworld_${attendee._id}_${i}_${Math.random().toString(36).substring(2, 10)}`;

      registrationDocs.push({
        event: liveEvent._id,
        user: attendee._id,
        ticketType: targetTicket._id,
        coupon: couponUsed,
        finalPrice,
        status,
        waitlistPosition,
        qrToken,
        interests,
        selectedSessions,
        checkedInAt,
        checkedInBy,
        createdAt: new Date(liveStart.getTime() - (200 - i) * 3600000),
      });
    }

    const createdRegistrations = await Registration.insertMany(registrationDocs);

    // 13. Seed Session Attendance
    // For checked-in attendees, record attendance across sessions
    // eslint-disable-next-line no-console
    console.log('📊 Scanning attendee badges into sessions (SessionAttendance records)...');
    const attendanceDocs = [];
    const checkedInRegistrations = createdRegistrations.filter(
      (r) => r.status === REGISTRATION_STATUS.CHECKED_IN
    );

    for (let idx = 0; idx < checkedInRegistrations.length; idx++) {
      const reg = checkedInRegistrations[idx];
      // Attend 2 sessions per attendee
      const sessionA = createdSessions[idx % 8];
      const sessionB = createdSessions[8 + (idx % 8)];

      attendanceDocs.push({
        session: sessionA._id,
        user: reg.user,
        event: liveEvent._id,
        scannedBy: idx % 2 === 0 ? staff1._id : staff2._id,
        scannedAt: new Date(sessionA.start.getTime() + 10 * 60000),
      });

      attendanceDocs.push({
        session: sessionB._id,
        user: reg.user,
        event: liveEvent._id,
        scannedBy: idx % 2 === 0 ? staff2._id : staff1._id,
        scannedAt: new Date(sessionB.start.getTime() + 15 * 60000),
      });
    }

    await SessionAttendance.insertMany(attendanceDocs);

    // 14. Seed Attendee Feedback
    // eslint-disable-next-line no-console
    console.log('⭐ Collecting authentic attendee feedback & rating distribution...');
    const feedbackDocs = [];
    const sampleReviews = [
      'Sensational keynote! The inference optimizations presented can immediately reduce our cloud spend.',
      'Extremely well organized. The speaker slides were high quality and the live Q&A was insightful.',
      'A bit crowded in the workshop room, but the hands-on coding walkthrough was worth it.',
      'Outstanding discussion on agentic architectures. Best conference session of the year so far!',
      'Good high-level overview, though I wish there was more code shown in the second half.',
      'Brilliant deep dive into multi-agent communication protocols. Highly recommended!',
    ];

    for (let f = 0; f < 40; f++) {
      const attendee = allAttendees[f];
      const session = createdSessions[f % createdSessions.length];
      const rating = [5, 5, 4, 5, 4, 3, 5, 4][f % 8];

      feedbackDocs.push({
        event: liveEvent._id,
        session: session._id,
        user: attendee._id,
        rating,
        comment: sampleReviews[f % sampleReviews.length],
      });
    }

    // Add general event feedback
    for (let f = 40; f < 55; f++) {
      const attendee = allAttendees[f];
      const rating = [5, 4, 5, 5, 4][f % 5];
      feedbackDocs.push({
        event: liveEvent._id,
        session: null,
        user: attendee._id,
        rating,
        comment: 'Venue facilities and A/V arrangements at Javits were fantastic. Check-in was seamless via QR code!',
      });
    }

    await Feedback.insertMany(feedbackDocs);

    // 15. Seed AI Telemetry Logs (AiLog)
    // eslint-disable-next-line no-console
    console.log('🤖 Recording AI draft generation & hybrid recommendation logs in AiLog...');
    await AiLog.insertMany([
      {
        user: organizerGlobal._id,
        event: liveEvent._id,
        type: 'event-description',
        prompt: 'Generate draft description for AI World Congress 2026',
        output: 'Draft description generated successfully with 4 key highlights',
        provider: 'deterministic-template-v1',
        tokens: 180,
      },
      {
        user: organizerGlobal._id,
        event: liveEvent._id,
        type: 'announcement',
        prompt: 'Draft announcement regarding keynote timing',
        output: 'Urgent broadcast notice generated for all attendees',
        provider: 'deterministic-template-v1',
        tokens: 95,
      },
      {
        user: sampleAttendee._id,
        event: liveEvent._id,
        type: 'hybrid-recommendations',
        prompt: 'Recommendations for interests [LLM, Agents]',
        output: 'Scored and ranked top 5 sessions with personalized rationales',
        provider: 'hybrid-engine-v1',
        tokens: 50,
      },
    ]);

    // 16. Seed Announcements
    // eslint-disable-next-line no-console
    console.log('📢 Broadcasting seed announcements...');
    await Announcement.insertMany([
      {
        event: liveEvent._id,
        title: 'Keynote Schedule Update: Dr. Sarah Chen at 09:30 AM',
        body: 'Please be seated in Grand Ballroom by 09:15 AM. Live translation headsets available at entrance.',
        audience: 'all',
        sentBy: organizerGlobal._id,
        isPinned: true,
        sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        event: liveEvent._id,
        title: 'Speaker Green Room & A/V Check In',
        body: 'All afternoon presenters please sync with A/V coordinators in Room 4B at 12:30 PM.',
        audience: 'speakers',
        sentBy: staff1._id,
        isPinned: false,
        sentAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ]);

    // 17. Seed Global Policies
    // eslint-disable-next-line no-console
    console.log('⚙️ Initializing global platform policies...');
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
      updatedBy: adminUser._id,
    });

    // eslint-disable-next-line no-console
    console.log('\n===============================================================');
    // eslint-disable-next-line no-console
    console.log('🎉 EVENTFORGE EXTENDED DATABASE SEED COMPLETED SUCCESSFULLY!');
    // eslint-disable-next-line no-console
    console.log('===============================================================');
    // eslint-disable-next-line no-console
    console.log(`👤 Users Seeded          : ${createdUsers.length + 2 + createdAttendees.length} (incl. ~200 attendees)`);
    // eslint-disable-next-line no-console
    console.log(`🏢 Organizations Seeded  : ${createdOrgs.length}`);
    // eslint-disable-next-line no-console
    console.log(`📍 Venues Seeded         : ${createdVenues.length}`);
    // eslint-disable-next-line no-console
    console.log(`🎤 Speakers Seeded       : ${createdSpeakers.length}`);
    // eslint-disable-next-line no-console
    console.log(`📅 Events Seeded         : ${createdEvents.length}`);
    // eslint-disable-next-line no-console
    console.log(`🎫 Ticket Types Seeded   : ${ticketTypes.length}`);
    // eslint-disable-next-line no-console
    console.log(`🎟️ Coupons Seeded        : ${coupons.length}`);
    // eslint-disable-next-line no-console
    console.log(`🗓️ Agenda Sessions Seeded: ${createdSessions.length}`);
    // eslint-disable-next-line no-console
    console.log(`💎 Sponsor Packages      : ${packages.length}`);
    // eslint-disable-next-line no-console
    console.log(`🤝 Sponsorships Formed   : ${sponsorships.length}`);
    // eslint-disable-next-line no-console
    console.log(`📝 Registrations Seeded  : ${createdRegistrations.length}`);
    // eslint-disable-next-line no-console
    console.log(`📊 Session Attendances   : ${attendanceDocs.length}`);
    // eslint-disable-next-line no-console
    console.log(`⭐ Feedback Ratings      : ${feedbackDocs.length}`);
    // eslint-disable-next-line no-console
    console.log('===============================================================');
    // eslint-disable-next-line no-console
    console.log('\n🔐 KEY CREDENTIALS TABLE:');
    // eslint-disable-next-line no-console
    console.table([
      { Role: 'Platform Admin', Email: 'admin@eventforge.com', Password: 'Password123!', GlobalRole: 'platform_admin' },
      { Role: 'Organizer (Acme)', Email: 'organizer@acme.com', Password: 'Password123!', GlobalRole: 'user' },
      { Role: 'Organizer (AI World)', Email: 'organizer@globaltech.org', Password: 'Password123!', GlobalRole: 'user' },
      { Role: 'Staff 1', Email: 'staff1@eventforge.com', Password: 'Password123!', GlobalRole: 'user' },
      { Role: 'Sponsor Lead 1', Email: 'sponsor@cloudscale.io', Password: 'Password123!', GlobalRole: 'user' },
      { Role: 'Sample Attendee', Email: 'attendee@eventforge.com', Password: 'Password123!', GlobalRole: 'user' },
      { Role: 'Attendee 001', Email: 'attendee1@eventforge-network.io', Password: 'Password123!', GlobalRole: 'user' },
    ]);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database Seeding Failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
