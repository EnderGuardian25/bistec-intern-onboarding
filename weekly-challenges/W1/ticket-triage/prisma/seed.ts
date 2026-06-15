import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  await db.ticket.createMany({
    data: [
      { title: 'Production API returning 500 on /auth endpoint', priority: 'P0', owner: 'Damian', status: 'open' },
      { title: 'Database connection pool exhausted in staging', priority: 'P0', owner: 'Kamal', status: 'open' },
      { title: 'CI pipeline failing on main branch — blocking all deployments', priority: 'P0', owner: 'Maya', status: 'open' },
      { title: 'Ticket list not refreshing after priority update', priority: 'P1', owner: 'Damian', status: 'open' },
      { title: 'Owner field not persisting on page reload', priority: 'P1', owner: null, status: 'open' },
      { title: 'API response time exceeding 150ms p95 threshold', priority: 'P1', owner: 'Kamal', status: 'open' },
      { title: 'ESLint errors not blocking PR merges in CI', priority: 'P1', owner: null, status: 'open' },
      { title: 'Add dark mode support to dashboard', priority: 'P2', owner: null, status: 'open' },
      { title: 'Improve empty state message when no tickets exist', priority: 'P2', owner: 'Maya', status: 'open' },
      { title: 'Add keyboard navigation to priority dropdown', priority: 'P2', owner: null, status: 'open' },
      { title: 'Update README with Docker setup instructions', priority: 'P2', owner: 'Damian', status: 'open' },
      { title: 'Write ADR for authentication approach in v2', priority: 'P2', owner: null, status: 'open' },
    ],
  })
  console.log('Seed complete — 12 tickets inserted')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
