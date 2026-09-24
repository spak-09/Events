/**
 * Seed data fixtures for EventForge.
 */

const usersSeed = [
  {
    name: 'Platform SuperAdmin',
    email: 'admin@eventforge.com',
    password: 'Password123!',
    globalRole: 'platform_admin',
    phone: '+1-555-0100',
  },
  {
    name: 'Sarah Jenkins (Acme Organizer)',
    email: 'organizer@acme.com',
    password: 'Password123!',
    globalRole: 'user',
    phone: '+1-555-0101',
  },
  {
    name: 'Marcus Vance (TechConf Organizer)',
    email: 'organizer@globaltech.org',
    password: 'Password123!',
    globalRole: 'user',
    phone: '+1-555-0102',
  },
  {
    name: 'Emily Watson (Operations Staff)',
    email: 'staff1@eventforge.com',
    password: 'Password123!',
    globalRole: 'user',
    phone: '+1-555-0103',
  },
  {
    name: 'David Kim (Floor Coordinator)',
    email: 'staff2@eventforge.com',
    password: 'Password123!',
    globalRole: 'user',
    phone: '+1-555-0104',
  },
  {
    name: 'Elena Rostova (Lead Sponsor)',
    email: 'sponsor@cloudscale.io',
    password: 'Password123!',
    globalRole: 'user',
    phone: '+1-555-0105',
  },
  {
    name: 'Alice Walker (Attendee)',
    email: 'attendee@eventforge.com',
    password: 'Password123!',
    globalRole: 'user',
    phone: '+1-555-0106',
  },
];

const organizationsSeed = [
  {
    name: 'Acme Corp Events',
    slug: 'acme-corp-events',
    plan: 'enterprise',
    status: 'active',
    settings: {
      maxEvents: 25,
      customBranding: true,
      allowPublicRegistration: true,
      defaultTimezone: 'America/New_York',
      features: ['vip_lounge', 'custom_domain', 'analytics_export', 'dedicated_support'],
    },
  },
  {
    name: 'Global Tech Conferences',
    slug: 'global-tech-conferences',
    plan: 'growth',
    status: 'active',
    settings: {
      maxEvents: 10,
      customBranding: false,
      allowPublicRegistration: true,
      defaultTimezone: 'America/Los_Angeles',
      features: ['standard_support', 'qr_checkin', 'badge_printing'],
    },
  },
];

const venuesSeed = [
  {
    name: 'Moscone Center',
    address: {
      street: '747 Howard St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      country: 'USA',
    },
    geo: {
      type: 'Point',
      coordinates: [-122.4013, 37.7842],
    },
    rooms: [
      {
        name: 'Main Keynote Hall',
        capacity: 3500,
        floor: 'Level 1',
        amenities: ['4K Projector', 'Stage Rigging', 'Live Broadcast', 'Simultaneous Translation'],
      },
      {
        name: 'Breakout Room Alpha',
        capacity: 250,
        floor: 'Level 2',
        amenities: ['Dual Monitors', 'Microphones', 'Whiteboard'],
      },
      {
        name: 'Workshop Lab A',
        capacity: 80,
        floor: 'Level 3',
        amenities: ['Workstations', 'High-Speed LAN', 'Power Stations'],
      },
    ],
    contactEmail: 'events@moscone.com',
    contactPhone: '+1-415-974-4000',
    isActive: true,
  },
  {
    name: 'Javits Convention Center',
    address: {
      street: '429 11th Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
    geo: {
      type: 'Point',
      coordinates: [-74.0026, 40.7578],
    },
    rooms: [
      {
        name: 'Grand Ballroom',
        capacity: 2500,
        floor: 'Level 3',
        amenities: ['Surround Sound', 'LED Video Wall', 'Press Gallery'],
      },
      {
        name: 'Tech Pavilion',
        capacity: 500,
        floor: 'Level 1',
        amenities: ['Booth Power', 'A/V Setup', 'High Ceiling'],
      },
      {
        name: 'Executive Boardroom',
        capacity: 40,
        floor: 'Level 4',
        amenities: ['Video Conferencing', 'Private Restroom', 'Catering Station'],
      },
    ],
    contactEmail: 'sales@javitscenter.com',
    contactPhone: '+1-212-216-2000',
    isActive: true,
  },
  {
    name: 'ExCeL London',
    address: {
      street: 'Royal Victoria Dock, 1 Western Gateway',
      city: 'London',
      state: 'England',
      postalCode: 'E16 1XL',
      country: 'United Kingdom',
    },
    geo: {
      type: 'Point',
      coordinates: [0.0305, 51.5085],
    },
    rooms: [
      {
        name: 'Auditorium One',
        capacity: 4000,
        floor: 'Ground Floor',
        amenities: ['Stadium Seating', 'Concert Sound', 'Live Satellite Uplink'],
      },
      {
        name: 'Docklands Suite',
        capacity: 300,
        floor: 'Mezzanine',
        amenities: ['River View', 'Smart Lighting', 'Private Reception'],
      },
      {
        name: 'Developer Stage',
        capacity: 150,
        floor: 'Hall S1',
        amenities: ['Podium', 'Multi-Screen Projection', 'Demo Bench'],
      },
    ],
    contactEmail: 'info@excel.london',
    contactPhone: '+44-20-7069-5000',
    isActive: true,
  },
  {
    name: 'Tokyo Big Sight',
    address: {
      street: '3-11-1 Ariake, Koto-ku',
      city: 'Tokyo',
      state: 'Tokyo',
      postalCode: '135-0063',
      country: 'Japan',
    },
    geo: {
      type: 'Point',
      coordinates: [139.7961, 35.6298],
    },
    rooms: [
      {
        name: 'International Conference Hall',
        capacity: 3000,
        floor: 'Reception Hall 7F',
        amenities: ['6-Language Booths', 'HD Projectors', 'Recording Studio'],
      },
      {
        name: 'East Hall 1',
        capacity: 800,
        floor: 'East Exhibition Hall',
        amenities: ['Cargo Door Access', 'High-Density Wi-Fi'],
      },
      {
        name: 'Innovation Stage',
        capacity: 200,
        floor: 'Conference Tower 6F',
        amenities: ['Interactive Touchscreens', 'Surround Sound'],
      },
    ],
    contactEmail: 'inquiry@bigsight.jp',
    contactPhone: '+81-3-5530-1111',
    isActive: true,
  },
];

const speakersSeed = [
  {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@ai-institute.org',
    bio: 'Pioneer in distributed deep learning architectures and large language foundation models.',
    company: 'DeepMind Research Partner',
    title: 'Principal AI Architect',
    expertise: ['Artificial Intelligence', 'LLMs', 'Neural Networks', 'Autonomous Agents'],
    links: {
      website: 'https://sarahchen.ai',
      twitter: 'https://twitter.com/sarahchen_ai',
      linkedin: 'https://linkedin.com/in/sarahchen-ai',
      github: 'https://github.com/sarahchen-ml',
    },
    availability: [
      { date: new Date('2026-10-15'), startTime: '09:00', endTime: '17:00', notes: 'Keynote slot only' },
    ],
  },
  {
    name: 'Alexandre Dubois',
    email: 'a.dubois@cloudmatrix.eu',
    bio: 'Specialist in multi-region Kubernetes deployments, GitOps, and platform engineering.',
    company: 'CloudMatrix Technologies',
    title: 'VP of Infrastructure',
    expertise: ['DevOps', 'Kubernetes', 'Cloud Infrastructure', 'Site Reliability'],
    links: {
      linkedin: 'https://linkedin.com/in/alexandre-dubois',
      github: 'https://github.com/adubois-cloud',
    },
    availability: [
      { date: new Date('2026-10-16'), startTime: '10:00', endTime: '16:00', notes: 'Available for panel and workshop' },
    ],
  },
  {
    name: 'Priya Sharma',
    email: 'priya@datapulse.io',
    bio: 'Data mesh architect helping Fortune 500 enterprises build real-time event streaming pipelines.',
    company: 'DataPulse Analytics',
    title: 'Chief Data Officer',
    expertise: ['Apache Kafka', 'Event-Driven Architecture', 'Data Mesh', 'Streaming'],
    links: {
      website: 'https://priyasharma.io',
      twitter: 'https://twitter.com/priya_data',
      linkedin: 'https://linkedin.com/in/priyasharma-data',
    },
    availability: [
      { date: new Date('2026-10-17'), startTime: '13:00', endTime: '18:00', notes: 'Available afternoons' },
    ],
  },
  {
    name: 'Liam O’Connor',
    email: 'liam@zerotrust-sec.com',
    bio: 'Offensive security researcher and authority on supply chain security and cloud-native IAM.',
    company: 'ZeroTrust Security',
    title: 'Head of Cybersecurity Research',
    expertise: ['Cybersecurity', 'Zero Trust', 'AppSec', 'Threat Modeling'],
    links: {
      twitter: 'https://twitter.com/liam_secops',
      linkedin: 'https://linkedin.com/in/liamoconnor-sec',
      github: 'https://github.com/liam-sec',
    },
    availability: [],
  },
  {
    name: 'Kenji Takahashi',
    email: 'kenji.takahashi@tokyoblock.jp',
    bio: 'Decentralized systems specialist exploring cryptographic zero-knowledge rollups and verifiable credentials.',
    company: 'Tokyo Blockchain Labs',
    title: 'Founding Fellow',
    expertise: ['Cryptography', 'Zero-Knowledge Proofs', 'Decentralized Identity', 'Web3'],
    links: {
      website: 'https://kenji-crypto.jp',
      github: 'https://github.com/ktakahashi-zk',
    },
    availability: [],
  },
  {
    name: 'Dr. Maria Santos',
    email: 'msantos@quantumscale.es',
    bio: 'Quantum algorithm developer researching near-term quantum optimization on NISQ hardware.',
    company: 'QuantumScale Iberia',
    title: 'Lead Quantum Scientist',
    expertise: ['Quantum Computing', 'Qiskit', 'Combinatorial Optimization'],
    links: {
      linkedin: 'https://linkedin.com/in/maria-santos-quantum',
    },
    availability: [],
  },
  {
    name: 'Marcus Brody',
    email: 'mbrody@fintech-gateway.com',
    bio: 'Core banking systems modernization consultant with 20 years in high-frequency trading networks.',
    company: 'FinTech Gateways',
    title: 'Senior Solutions Architect',
    expertise: ['FinTech', 'High-Throughput Systems', 'Distributed Transactions'],
    links: {
      linkedin: 'https://linkedin.com/in/marcus-brody-fin',
    },
    availability: [],
  },
  {
    name: 'Zainab Al-Mansoor',
    email: 'zainab@futurehealth.ae',
    bio: 'Healthcare AI leader designing HIPAA/GDPR-compliant multimodal diagnostic assistants.',
    company: 'FutureHealth Systems',
    title: 'Director of Healthcare AI',
    expertise: ['Healthcare AI', 'Medical Imaging', 'Regulatory Compliance'],
    links: {
      website: 'https://zainabalmansoor.com',
      linkedin: 'https://linkedin.com/in/zainab-al-mansoor',
    },
    availability: [],
  },
  {
    name: 'Sophie Müller',
    email: 'sophie.m@greentech-berlin.de',
    bio: 'Advocate for sustainable software engineering, carbon-aware cloud computing, and green code metrics.',
    company: 'GreenTech Berlin',
    title: 'Sustainability Officer',
    expertise: ['Green Computing', 'Carbon Footprint Optimization', 'Energy-Efficient Systems'],
    links: {
      twitter: 'https://twitter.com/green_sophie',
      linkedin: 'https://linkedin.com/in/sophie-mueller-green',
    },
    availability: [],
  },
  {
    name: 'Carlos Mendoza',
    email: 'carlos@iot-frontier.mx',
    bio: 'Industrial IoT architect connecting million-sensor edge arrays to cloud backplanes.',
    company: 'Frontier IoT Systems',
    title: 'IoT Principal Engineer',
    expertise: ['Edge Computing', 'IoT Protocols', 'Embedded Systems', 'MQTT'],
    links: {
      github: 'https://github.com/cmendoza-iot',
    },
    availability: [],
  },
  {
    name: 'Grace Hopper-Lee',
    email: 'grace@uxforge.io',
    bio: 'Human-computer interaction researcher obsessed with micro-interactions and neuro-inclusive design.',
    company: 'UXForge Interactive',
    title: 'Head of Product Design',
    expertise: ['Design Systems', 'Accessibility (a11y)', 'Human-AI Interfaces'],
    links: {
      website: 'https://gracehopperlee.design',
      linkedin: 'https://linkedin.com/in/grace-hopper-lee',
    },
    availability: [],
  },
  {
    name: 'Tariq Hassan',
    email: 'tariq@apiguild.com',
    bio: 'API designer, author of "RESTful Domain Driven Microservices", and OpenAPI champion.',
    company: 'API Architects Guild',
    title: 'Chief API Strategist',
    expertise: ['API Governance', 'Microservices', 'GraphQL', 'gRPC'],
    links: {
      twitter: 'https://twitter.com/tariq_api',
      linkedin: 'https://linkedin.com/in/tariq-hassan-api',
      github: 'https://github.com/thassan-api',
    },
    availability: [],
  },
];

module.exports = {
  usersSeed,
  organizationsSeed,
  venuesSeed,
  speakersSeed,
};
