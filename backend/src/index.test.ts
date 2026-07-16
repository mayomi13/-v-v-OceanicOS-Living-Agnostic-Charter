import { PrismaClient } from '@prisma/client'

// Use localhost for local testing, db service name for Docker
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vovv?schema=public'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function runTests() {
  console.log('🧪 Running backend tests...')
  console.log(`📡 Using database URL: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`)
  
  try {
    // Test 1: Database connection
    console.log('✓ Test 1: Database connection')
    const health = await prisma.$queryRaw`SELECT 1`
    if (!health) throw new Error('Database health check failed')
    
    // Test 2: Create proposal
    console.log('✓ Test 2: Create proposal')
    const proposal = await prisma.proposal.create({
      data: {
        title: 'Test Proposal',
        body: 'Testing proposal creation',
        status: 'open'
      }
    })
    if (!proposal.id) throw new Error('Failed to create proposal')
    
    // Test 3: Read proposals
    console.log('✓ Test 3: Read proposals')
    const proposals = await prisma.proposal.findMany()
    if (!Array.isArray(proposals)) throw new Error('Failed to read proposals')
    if (proposals.length === 0) throw new Error('No proposals found after creation')
    
    // Test 4: Update proposal
    console.log('✓ Test 4: Update proposal status')
    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'approved' }
    })
    if (updated.status !== 'approved') throw new Error('Failed to update proposal')
    
    // Test 5: Delete proposal
    console.log('✓ Test 5: Delete proposal')
    await prisma.proposal.delete({ where: { id: proposal.id } })
    const deleted = await prisma.proposal.findUnique({ where: { id: proposal.id } })
    if (deleted !== null) throw new Error('Failed to delete proposal')
    
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Test failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTests()
