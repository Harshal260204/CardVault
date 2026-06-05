import { CaptureMode, LeadQualifier, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

function applyDatabaseUrlFromParts(): void {
  if (process.env.DATABASE_URL?.trim()) return;
  const keys = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'] as const;
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`Missing ${key} in .env for seed`);
    }
  }
  const user = encodeURIComponent(process.env.DB_USER!);
  const password = encodeURIComponent(process.env.DB_PASSWORD!);
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;
}

applyDatabaseUrlFromParts();

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

const PRODUCT_PLANS = [
  {
    id: '00000000-0000-4000-9000-000000000001',
    code: 'free',
    name: 'Free',
    priceInr: 0,
    billingInterval: null,
    description: 'Free plan for the entire CardVault product.',
  },
  {
    id: '00000000-0000-4000-9000-000000000002',
    code: 'pro',
    name: 'Pro',
    priceInr: 99,
    billingInterval: 'monthly',
    description: 'Paid CardVault plan billed at 99 Rs per month.',
  },
] as const;

const ORGS = [
  {
    slug: 'cardvault-demo',
    name: 'CardVault Demo',
    plan: 'pro',
    users: [
      { email: 'employee@cardvault.local', fullName: 'Sales Employee', role: UserRole.employee },
      { email: 'manager@cardvault.local', fullName: 'Org Manager', role: UserRole.manager },
      { email: 'admin@cardvault.local', fullName: 'Super Admin', role: UserRole.platform_super_admin },
    ],
    sessionId: '00000000-0000-4000-8000-000000000001',
    contactIds: [
      '00000000-0000-4000-8001-000000000001',
      '00000000-0000-4000-8001-000000000002',
      '00000000-0000-4000-8001-000000000003',
    ],
  },
  {
    slug: 'acme-demo',
    name: 'Acme Corp Demo',
    plan: 'free',
    users: [
      { email: 'employee@acme.local', fullName: 'Acme Sales Rep', role: UserRole.employee },
      { email: 'manager@acme.local', fullName: 'Acme Manager', role: UserRole.manager },
    ],
    sessionId: '00000000-0000-4000-8000-000000000002',
    contactIds: [
      '00000000-0000-4000-8002-000000000001',
      '00000000-0000-4000-8002-000000000002',
    ],
  },
] as const;

const DEMO_CONTACTS_CARDVAULT: DemoContact[] = [
  {
    fullName: 'Alex Rivera',
    company: 'Northwind Logistics',
    title: 'VP Partnerships',
    emails: ['alex.rivera@northwind.io'],
    phones: ['+1-555-0101'],
    captureMode: CaptureMode.visitor,
    leadQualifier: LeadQualifier.hot,
    tags: ['trade-show', 'priority'],
  },
  {
    fullName: 'Priya Shah',
    company: 'Helix Biotech',
    title: 'Director of Sales',
    emails: ['priya@helixbio.com'],
    phones: ['+1-555-0102'],
    captureMode: CaptureMode.exhibitor,
    leadQualifier: LeadQualifier.warm,
    tags: ['expo-hall'],
  },
  {
    fullName: 'Jordan Lee',
    company: 'Summit Capital',
    title: 'Associate',
    emails: ['jordan.lee@summit.cap'],
    phones: [],
    captureMode: CaptureMode.quick_capture,
    leadQualifier: LeadQualifier.cold,
    tags: ['hallway'],
  },
];

const DEMO_CONTACTS_ACME: DemoContact[] = [
  {
    fullName: 'Sam Taylor',
    company: 'Acme Industries',
    title: 'Buyer',
    emails: ['sam@acme-industries.com'],
    phones: ['+1-555-0201'],
    captureMode: CaptureMode.visitor,
    leadQualifier: LeadQualifier.warm,
    tags: ['acme'],
  },
  {
    fullName: 'Riley Chen',
    company: 'Chen Supply',
    title: 'Owner',
    emails: ['riley@chen.supply'],
    phones: ['+1-555-0202'],
    captureMode: CaptureMode.exhibitor,
    leadQualifier: LeadQualifier.hot,
    tags: ['acme'],
  },
];

interface DemoContact {
  fullName: string;
  company: string;
  title: string;
  emails: string[];
  phones: string[];
  captureMode: CaptureMode;
  leadQualifier: LeadQualifier;
  tags: string[];
}

async function seedPlans() {
  for (const plan of PRODUCT_PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        name: plan.name,
        priceInr: plan.priceInr,
        billingInterval: plan.billingInterval,
        description: plan.description,
        isActive: true,
      },
    });
  }
}

async function seedOrg(
  passwordHash: string,
  config: (typeof ORGS)[number],
  contacts: DemoContact[],
) {
  const org = await prisma.organization.upsert({
    where: { slug: config.slug },
    create: {
      name: config.name,
      slug: config.slug,
      plan: config.plan,
    },
    update: { name: config.name, isActive: true },
  });

  console.log(`\nOrganization: ${org.name} (${org.slug})`);

  const userByEmail: Record<string, { id: string }> = {};
  for (const demo of config.users) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        organizationId: org.id,
        email: demo.email,
        fullName: demo.fullName,
        role: demo.role,
        passwordHash,
        isActive: true,
      },
      update: {
        organizationId: org.id,
        fullName: demo.fullName,
        role: demo.role,
        passwordHash,
        isActive: true,
        deletedAt: null,
      },
    });
    userByEmail[demo.email] = { id: user.id };
    console.log(`  ${String(user.role).padEnd(12)} ${user.email}`);
  }

  const employeeEmail = config.users[0].email;
  const employee = userByEmail[employeeEmail];

  const session = await prisma.eventSession.upsert({
    where: { id: config.sessionId },
    create: {
      id: config.sessionId,
      organizationId: org.id,
      createdById: employee.id,
      name: `${config.name} Expo 2026`,
      mode: CaptureMode.visitor,
      eventType: 'trade_show',
      scanCount: contacts.length,
      hotCount: contacts.filter((c) => c.leadQualifier === LeadQualifier.hot).length,
      warmCount: contacts.filter((c) => c.leadQualifier === LeadQualifier.warm).length,
      coldCount: contacts.filter((c) => c.leadQualifier === LeadQualifier.cold).length,
    },
    update: { deletedAt: null },
  });

  await prisma.sessionMember.upsert({
    where: { sessionId_userId: { sessionId: session.id, userId: employee.id } },
    create: { sessionId: session.id, userId: employee.id, organizationId: org.id },
    update: {},
  });

  for (const [index, demo] of contacts.entries()) {
    const contactId = config.contactIds[index];
    if (!contactId) continue;
    await prisma.contact.upsert({
      where: { id: contactId },
      create: {
        id: contactId,
        organizationId: org.id,
        createdById: employee.id,
        eventSessionId: session.id,
        fullName: demo.fullName,
        company: demo.company,
        title: demo.title,
        emails: demo.emails,
        phones: demo.phones,
        captureMode: demo.captureMode,
        leadQualifier: demo.leadQualifier,
        tags: demo.tags,
      },
      update: { fullName: demo.fullName, deletedAt: null, isMerged: false },
    });
  }

  return org;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await seedPlans();

  const cardvaultOrg = await seedOrg(passwordHash, ORGS[0], DEMO_CONTACTS_CARDVAULT);
  const acmeOrg = await seedOrg(passwordHash, ORGS[1], DEMO_CONTACTS_ACME);

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@cardvault.local' },
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: cardvaultOrg.id,
      actorId: admin?.id,
      actorRole: UserRole.platform_super_admin,
      eventType: 'seed.completed',
      entityType: 'organization',
      entityId: cardvaultOrg.id,
      eventData: {
        organizations: [cardvaultOrg.slug, acmeOrg.slug],
        passwordHint: 'Password123! for all demo users',
      },
    },
  });

  console.log('\n── Cross-tenant test ──');
  console.log('  cardvault-demo: employee@cardvault.local');
  console.log('  acme-demo:      employee@acme.local');
  console.log('  platform admin: admin@cardvault.local (platform_super_admin)');
  console.log('\nDemo password for all users:', DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
