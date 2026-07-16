import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';

type Proposal = {
  id: string;
  title: string;
  body?: string;
  status?: string;
  createdAt?: string;
};

const server = Fastify({ logger: true });

server.get('/health', async () => ({ status: 'ok' }));

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

const PROPOSALS_FILE = path.join(__dirname, '..', 'data', 'proposals.json');

function readProposals(): Proposal[] {
  try {
    if (!fs.existsSync(PROPOSALS_FILE)) return [];
    const raw = fs.readFileSync(PROPOSALS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeProposals(proposals: Proposal[]) {
  const dir = path.dirname(PROPOSALS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(proposals, null, 2));
}

server.get('/proposals', async () => {
  return readProposals();
});

server.post('/proposals', async (req, reply) => {
  try {
    const body = req.body as any;
    const proposals = readProposals();
    const id = 'p_' + Date.now().toString(36);
    const p: Proposal = { id, title: body.title || 'Untitled', body: body.body || '', status: 'open', createdAt: new Date().toISOString() };
    proposals.unshift(p);
    writeProposals(proposals);
    reply.code(201);
    return p;
  } catch (err) {
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
