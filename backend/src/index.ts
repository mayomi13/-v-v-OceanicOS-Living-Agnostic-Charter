import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { registerVerificationRoutes } from './verification';

type Proposal = {
  id: string;
  title: string;
  body?: string;
  status?: string;
  createdAt?: string;
};

const server = Fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));
void registerVerificationRoutes(server);

server.get('/charter', async (req, reply) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'vΩ∞v OceanicOS Living Agnostic Charter', 'README.md');
    const content = fs.readFileSync(filePath, 'utf8');
    return { content };
  } catch (err) {
    reply.code(500);
    return { error: 'unable to load charter' };
  }
});

const prisma = new PrismaClient();

server.get('/proposals', async () => {
  const items = await prisma.proposal.findMany({ orderBy: { createdAt: 'desc' } });
  return items;
});

server.post('/proposals', async (req, reply) => {
  try {
    const body = req.body as any;
    const p = await prisma.proposal.create({ data: { title: body.title || 'Untitled', body: body.body || '', status: 'open' } });
    reply.code(201);
    return p;
  } catch (err) {
    server.log.error(err);
    reply.code(500);
    return { error: 'unable to create proposal' };
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
