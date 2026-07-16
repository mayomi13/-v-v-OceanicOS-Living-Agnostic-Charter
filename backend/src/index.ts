import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';

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

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
