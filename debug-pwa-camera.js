#!/usr/bin/env node

// Debug script to check PWA camera and session issues
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugPWAIssues() {
  console.log('🔍 PWA CAMERA & SESSION DEBUG REPORT')
  console.log('=====================================\n')

  try {
    // Check affiliate sessions
    console.log('📱 AFFILIATE SESSIONS:')
    const activeSessions = await prisma.affiliateSession.findMany({
      where: { isActive: true },
      include: { affiliate: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    if (activeSessions.length === 0) {
      console.log('❌ No active affiliate sessions found!')
    } else {
      activeSessions.forEach(session => {
        const now = new Date()
        const isExpired = now > session.expiresAt
        console.log(`   📋 ${session.affiliate.name} (${session.affiliate.email})`)
        console.log(`      Token: ${session.sessionToken.substring(0, 8)}...`)
        console.log(`      Created: ${session.createdAt.toISOString()}`)
        console.log(`      Expires: ${session.expiresAt.toISOString()}`)
        console.log(`      Last Used: ${session.lastUsedAt?.toISOString() || 'Never'}`)
        console.log(`      Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`)
        console.log(`      Device: ${session.deviceInfo}`)
        console.log('')
      })
    }

    // Check recent visits stats
    console.log('📊 RECENT VISITS STATS:')
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())

    const recentVisits = await prisma.affiliateVisit.findMany({
      where: { visitedAt: { gte: thisWeekStart } },
      include: { affiliate: { select: { name: true, email: true } } },
      orderBy: { visitedAt: 'desc' },
      take: 5
    })

    if (recentVisits.length === 0) {
      console.log('❌ No visits this week - This could cause "NaN" stats!')
    } else {
      console.log(`   Found ${recentVisits.length} visits this week:`)
      recentVisits.forEach(visit => {
        console.log(`   📈 ${visit.affiliate.name} scanned ${visit.qrCode}`)
        console.log(`      Customer: ${visit.customerName}`)
        console.log(`      Time: ${visit.visitedAt.toISOString()}`)
        console.log('')
      })
    }

    // Check for potential NaN causes
    console.log('🔢 STAT CALCULATION CHECK:')
    const affiliates = await prisma.affiliate.findMany({ where: { isActive: true } })
    
    for (const affiliate of affiliates.slice(0, 3)) { // Check first 3 affiliates
      const [todayCount, weekCount] = await Promise.all([
        prisma.affiliateVisit.count({
          where: { affiliateId: affiliate.id, visitedAt: { gte: today } }
        }),
        prisma.affiliateVisit.count({
          where: { affiliateId: affiliate.id, visitedAt: { gte: thisWeekStart } }
        })
      ])

      console.log(`   📋 ${affiliate.name}:`)
      console.log(`      Today: ${todayCount}`)
      console.log(`      This Week: ${weekCount}`)
      console.log(`      Total: ${affiliate.totalVisits}`)
      
      if (isNaN(todayCount) || isNaN(weekCount)) {
        console.log(`      ❌ NaN DETECTED for ${affiliate.name}!`)
      }
      console.log('')
    }

    // Check for any database schema issues
    console.log('🗃️ DATABASE SCHEMA CHECK:')
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' 
        AND name IN ('AffiliateSession', 'AffiliateVisit', 'Affiliate');
      `
      console.log('   Available tables:', tableInfo)
    } catch (error) {
      console.log('   ❌ Could not check tables:', error.message)
    }

  } catch (error) {
    console.error('💥 Debug Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugPWAIssues() 