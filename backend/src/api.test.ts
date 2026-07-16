import Fastify from 'fastify'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vovv?schema=public'
    }
  }
})

async function runIntegrationTests() {
  console.log('🧪 Running API endpoint tests...\n')

  const server = Fastify({ logger: false })

  // Setup routes (same as main server)
  server.get('/health', async () => ({ status: 'ok' }))

  server.get('/charter', async (req, reply) => {
    try {
      const filePath = path.join(__dirname, '..', '..', 'vΩ∞v OceanicOS Living Agnostic Charter', 'README.md')
      const content = fs.readFileSync(filePath, 'utf8')
      return { content }
    } catch (err) {
      reply.code(500)
      return { error: 'unable to load charter' }
    }
  })

  server.get('/proposals', async () => {
    return await prisma.proposal.findMany({ orderBy: { createdAt: 'desc' } })
  })

  server.post('/proposals', async (req, reply) => {
    try {
      const body = req.body as any
      const p = await prisma.proposal.create({
        data: { title: body.title || 'Untitled', body: body.body || '', status: 'open' }
      })
      reply.code(201)
      return p
    } catch (err) {
      reply.code(500)
      return { error: 'unable to create proposal' }
    }
  })

  try {
    await server.listen({ port: 3001, host: '127.0.0.1' })
    console.log('✓ Server started on http://127.0.0.1:3001\n')

    // Test 1: Health endpoint
    console.log('✓ Test 1: GET /health')
    const healthRes = await server.inject({ method: 'GET', url: '/health' })
    if (healthRes.statusCode !== 200) throw new Error('Health check failed')
    const health = JSON.parse(healthRes.body)
    if (health.status !== 'ok') throw new Error('Health status not ok')

    // Test 2: Charter endpoint
    console.log('✓ Test 2: GET /charter')
    const charterRes = await server.inject({ method: 'GET', url: '/charter' })
    if (charterRes.statusCode !== 200) throw new Error('Charter fetch failed')
    const charter = JSON.parse(charterRes.body)
    if (!charter.content) throw new Error('No charter content')

    // Test 3: Get proposals (empty)
    console.log('✓ Test 3: GET /proposals (initial)')
    const listRes = await server.inject({ method: 'GET', url: '/proposals' })
    if (listRes.statusCode !== 200) throw new Error('List proposals failed')
    const proposals = JSON.parse(listRes.body)
    if (!Array.isArray(proposals)) throw new Error('Proposals not an array')

    // Test 4: Create proposal
    console.log('✓ Test 4: POST /proposals')
    const createRes = await server.inject({
      method: 'POST',
      url: '/proposals',
      payload: { title: 'API Test Proposal', body: 'Created via API test' }
    })
    if (createRes.statusCode !== 201) throw new Error('Create proposal failed')
    const newProposal = JSON.parse(createRes.body)
    if (!newProposal.id) throw new Error('No proposal ID returned')

    // Test 5: List proposals (should have one)
    console.log('✓ Test 5: GET /proposals (after create)')
    const listRes2 = await server.inject({ method: 'GET', url: '/proposals' })
    const proposals2 = JSON.parse(listRes2.body)
    if (proposals2.length === 0) throw new Error('Proposal not found after creation')
    if (proposals2[0].title !== 'API Test Proposal') throw new Error('Proposal title mismatch')

    console.log('\n✅ All API tests passed!')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Test failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await server.close()
    await prisma.$disconnect()
  }
}

runIntegrationTests()
