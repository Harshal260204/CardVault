import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  // Store tokens and IDs
  let tokenOrgAEmployee: string; // employee@cardvault.local
  let tokenOrgBEmployee: string; // employee@acme.local
  let tokenOrgBManager: string; // manager@acme.local
  let tokenPlatformAdmin: string; // admin@cardvault.local

  let orgAId: string;
  let orgBId: string;

  let contactAId: string; // belongs to Org A (CardVault)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();

    // Retrieve Org IDs from Database
    const orgA = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'cardvault-demo' },
    });
    const orgB = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'acme-demo' },
    });
    orgAId = orgA.id;
    orgBId = orgB.id;

    // Retrieve Contacts from Database
    const contactA = await prisma.contact.findFirstOrThrow({
      where: { organizationId: orgAId },
    });
    await prisma.contact.findFirstOrThrow({
      where: { organizationId: orgBId },
    });
    contactAId = contactA.id;

    // Perform Login to get JWT access tokens
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(201);
      return res.body.data.tokens.accessToken;
    };

    tokenOrgAEmployee = await login('employee@cardvault.local');
    tokenOrgBEmployee = await login('employee@acme.local');
    tokenOrgBManager = await login('manager@acme.local');
    tokenPlatformAdmin = await login('admin@cardvault.local');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('1. Read Isolation (GET /contacts/:id)', () => {
    it('should allow same-tenant employee to read their own tenant contact', async () => {
      await request(app.getHttpServer())
        .get(`/contacts/${contactAId}`)
        .set('Authorization', `Bearer ${tokenOrgAEmployee}`)
        .expect(200);
    });

    it('should block cross-tenant employee from reading another tenant contact (returns 404)', async () => {
      // It returns 404 because the Prisma extension/where filter limits visibility to the user's tenant
      await request(app.getHttpServer())
        .get(`/contacts/${contactAId}`)
        .set('Authorization', `Bearer ${tokenOrgBEmployee}`)
        .expect(404);
    });
  });

  describe('2. Query Parameter / Routing Protection (TenantGuard)', () => {
    it('should reject non-platform user specifying another organizationId in query (returns 403)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users?organizationId=${orgAId}`)
        .set('Authorization', `Bearer ${tokenOrgBManager}`)
        .expect(403);
      expect(response.body.error.message).toContain(
        'Cross-tenant access denied',
      );
    });

    it('should allow platform admin to query cross-tenant statistics/users (returns 200)', async () => {
      await request(app.getHttpServer())
        .get(`/users?organizationId=${orgBId}`)
        .set('Authorization', `Bearer ${tokenPlatformAdmin}`)
        .expect(200);
    });
  });

  describe('3. Write Isolation & Creation Scope Safeguards', () => {
    it('should reject non-platform user trying to create a contact under another organization in body (returns 403)', async () => {
      // Note: We bypass whitelist validation by sending organizationId.
      // If the body contains organizationId, TenantGuard intercepts and rejects it if it doesn't match actor org
      const response = await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${tokenOrgBEmployee}`)
        .send({
          fullName: 'Malicious Attacker',
          company: 'SaaS Hackers',
          organizationId: orgAId, // Attempting to inject contact into CardVault
        })
        .expect(403);

      expect(response.body.error.message).toContain(
        'Cross-tenant access denied',
      );
    });

    it('should allow user to create contact in their own tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${tokenOrgBEmployee}`)
        .send({
          fullName: 'Valid Contact',
          company: 'Acme Partner',
        })
        .expect(201);

      expect(response.body.data.fullName).toBe('Valid Contact');

      // Clean up test contact
      const createdId = response.body.data.id;
      await prisma.contact.delete({ where: { id: createdId } });
    });
  });
});
