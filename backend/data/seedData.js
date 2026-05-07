const Location = require('../models/Location');
const ScrapCategory = require('../models/ScrapCategory');
const Service = require('../models/Service');
const User = require('../models/User');

const OPERATING_MODES = ['Doorstep Scrap Pickup', 'Business Bulk Clearance'];
const DEFAULT_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@scrap.local').trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

const DEFAULT_LOCATIONS = [
  { pinCode: '575001', areaName: 'Mangalore Central', city: 'Mangaluru', state: 'Karnataka', isServiceable: true },
  { pinCode: '575007', areaName: 'Adyar', city: 'Mangaluru', state: 'Karnataka', isServiceable: true },
  { pinCode: '575011', areaName: 'Baikampady', city: 'Mangaluru', state: 'Karnataka', isServiceable: true },
  { pinCode: '575013', areaName: 'Kulur', city: 'Mangaluru', state: 'Karnataka', isServiceable: true },
  { pinCode: '575014', areaName: 'Surathkal', city: 'Mangaluru', state: 'Karnataka', isServiceable: true },
  { pinCode: '575019', areaName: 'Kulai', city: 'Mangaluru', state: 'Karnataka', isServiceable: true },
  { pinCode: '576201', areaName: 'Kundapura', city: 'Kundapura', state: 'Karnataka', isServiceable: true },
  { pinCode: '576214', areaName: 'Byndoor', city: 'Byndoor', state: 'Karnataka', isServiceable: true },
  { pinCode: '576233', areaName: 'Jadkal', city: 'Kundapura', state: 'Karnataka', isServiceable: true },
];

const DEFAULT_SCRAP_CATEGORIES = [
  {
    name: 'Iron & Steel Scrap',
    description: 'Heavy metal scrap, grills, utensils, rods, and structural steel pickup.',
    basePrice: 28,
    imageUrl: '/scrap/metal-scrap-yard.jpeg',
    isActive: true,
  },
  {
    name: 'Copper Wire Scrap',
    description: 'Copper wire bundles, motor windings, and high-value copper scrap collection.',
    basePrice: 560,
    imageUrl: '/scrap/copper-wire-spool.jpeg',
    isActive: true,
  },
  {
    name: 'Aluminium Scrap',
    description: 'Aluminium sheets, frames, vessels, and fabrication leftovers for pickup.',
    basePrice: 120,
    imageUrl: '/scrap/aluminum-rolls-factory.svg',
    isActive: true,
  },
  {
    name: 'Mixed Metal Scrap',
    description: 'Mixed household and commercial metal scrap including tools, parts, and fittings.',
    basePrice: 40,
    imageUrl: '/scrap/metal-scrap-yard.jpeg',
    isActive: true,
  },
  {
    name: 'Paper & Cardboard',
    description: 'Newspapers, office paper, cartons, and mixed paper waste collection.',
    basePrice: 14,
    imageUrl: '/scrap/paper-scrap-stack.jpeg',
    isActive: true,
  },
  {
    name: 'Plastic & Household Mix',
    description: 'Plastic containers, bottles, and dry recyclable household scrap.',
    basePrice: 18,
    imageUrl: '/scrap/plastic-scrap-mix.webp',
    isActive: true,
  },
  {
    name: 'E-Waste Devices',
    description: 'Old laptops, phones, batteries, wires, chargers, and small electronics.',
    basePrice: 42,
    imageUrl: '/scrap/mobile-scrap-phones.avif',
    isActive: true,
  },
];

const DEFAULT_SERVICES = [
  {
    name: 'Doorstep Scrap Pickup',
    serviceGroup: 'service',
    description: 'Scheduled home pickup for recyclable scrap across Mangaluru and nearby areas.',
    basePrice: 99,
    imageUrl: '/services/doorstep-scrap-pickup.jpeg',
    isAvailable: true,
  },
  {
    name: 'Business Bulk Clearance',
    serviceGroup: 'service',
    description: 'High-volume scrap removal for shops, warehouses, schools, and offices.',
    basePrice: 499,
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Indoor Full Home Cleaning',
    serviceGroup: 'homeService',
    description: 'Complete room-to-room cleaning for bedrooms, hall, kitchen, and bathrooms in one visit.',
    basePrice: 2499,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Home Deep Cleaning Service',
    serviceGroup: 'homeService',
    description: 'Detailed deep cleaning for floors, corners, switches, shelves, and hard-to-reach surfaces.',
    basePrice: 3299,
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Outdoor Cleaning Service',
    serviceGroup: 'homeService',
    description: 'Cleaning for terrace, compound, parking area, front yard, and outdoor surfaces.',
    basePrice: 1899,
    imageUrl: '/services/outdoor-cleaning-service.webp',
    isAvailable: true,
  },
  {
    name: 'Water Tank Cleaning',
    serviceGroup: 'homeService',
    description: 'Overhead and underground tank cleaning with sludge removal and wash-down support.',
    basePrice: 1499,
    imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Bathroom Deep Cleaning',
    serviceGroup: 'homeService',
    description: 'Tile, sink, fitting, commode, and stain-focused bathroom sanitization service.',
    basePrice: 899,
    imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Kitchen Deep Cleaning',
    serviceGroup: 'homeService',
    description: 'Platform, chimney exterior, cabinets, wall grease cleaning, and sink area detailing.',
    basePrice: 1299,
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Plumbing Work',
    serviceGroup: 'homeService',
    description: 'General plumbing support for taps, sinks, pipe leakage, drainage, and fitting replacement.',
    basePrice: 499,
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Electrical Work',
    serviceGroup: 'homeService',
    description: 'Electrician support for switches, lights, fans, wiring checks, and fixture installation.',
    basePrice: 599,
    imageUrl: 'https://images.unsplash.com/photo-1713937400833-f817938b51e4?auto=format&fit=crop&fm=jpg&q=80&w=1600',
    isAvailable: true,
  },
  {
    name: 'Labour Supply',
    serviceGroup: 'homeService',
    description: 'General labour support for shifting, loading, unloading, cleaning, and site assistance.',
    basePrice: 899,
    imageUrl: '/services/labour-supply.jpeg',
    isAvailable: true,
  },
  {
    name: 'Sofa & Carpet Cleaning',
    serviceGroup: 'homeService',
    description: 'Fabric surface cleaning for sofas, cushions, carpets, and soft furnishing areas.',
    basePrice: 999,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'E-Waste Pickup Drive',
    serviceGroup: 'service',
    description: 'Safe electronics collection for homes, apartments, and institutions.',
    basePrice: 149,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Factory Scrap Segregation',
    serviceGroup: 'service',
    description: 'On-site sorting support before transport for industrial scrap loads.',
    basePrice: 799,
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
];

const upsertMany = async (Model, items, key) => {
  await Promise.all(
    items.map((item) =>
      Model.updateOne({ [key]: item[key] }, { $set: item }, { upsert: true })
    )
  );
};

const ensureDefaultAdminUser = async () => {
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existingAdmin) {
    let didChange = false;

    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      didChange = true;
    }

    if (!existingAdmin.isActive) {
      existingAdmin.isActive = true;
      didChange = true;
    }

    if (didChange) {
      await existingAdmin.save();
    }

    return;
  }

  const primaryLocation = DEFAULT_LOCATIONS[0];
  await User.create({
    fullName: 'System Admin',
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    phone: '9999999999',
    address: 'EcoScrap HQ',
    pinCode: primaryLocation.pinCode,
    areaName: primaryLocation.areaName,
    city: primaryLocation.city,
    state: primaryLocation.state,
    operatingMode: OPERATING_MODES[0],
    role: 'admin',
    isActive: true,
  });
};

const seedDefaultData = async () => {
  await Promise.all([
    upsertMany(Location, DEFAULT_LOCATIONS, 'pinCode'),
    upsertMany(ScrapCategory, DEFAULT_SCRAP_CATEGORIES, 'name'),
    upsertMany(Service, DEFAULT_SERVICES, 'name'),
  ]);

  await ensureDefaultAdminUser();
};

module.exports = {
  DEFAULT_LOCATIONS,
  DEFAULT_SCRAP_CATEGORIES,
  DEFAULT_SERVICES,
  DEFAULT_ADMIN_EMAIL,
  OPERATING_MODES,
  seedDefaultData,
};
