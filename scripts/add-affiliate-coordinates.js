const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Coordinate mapping for main cities
const cityCoordinates = {
  'Playa del Carmen': { lat: 20.6296, lng: -87.0739 },
  'Cancún': { lat: 21.1619, lng: -86.8515 },
  'Cancun': { lat: 21.1619, lng: -86.8515 },
  'Tulum': { lat: 20.2150, lng: -87.4514 },
  'Cozumel': { lat: 20.4229, lng: -86.9223 },
  'Isla Mujeres': { lat: 21.2369, lng: -86.7339 },
  'Puerto Morelos': { lat: 20.8470, lng: -86.8755 },
  'Puerto Aventuras': { lat: 20.5000, lng: -87.2333 },
  'Bacalar': { lat: 18.6783, lng: -88.3883 },
  'Holbox': { lat: 21.5444, lng: -87.3806 }
}

// Sample coordinates for businesses within each city
// These are approximate locations - in a real scenario, you'd get exact coordinates
const sampleBusinessCoordinates = {
  'Playa del Carmen': [
    { lat: 20.6296, lng: -87.0739 }, // Downtown
    { lat: 20.6350, lng: -87.0750 }, // 5th Avenue
    { lat: 20.6250, lng: -87.0700 }, // Beach area
    { lat: 20.6400, lng: -87.0800 }, // North area
    { lat: 20.6200, lng: -87.0650 }, // South area
    { lat: 20.6300, lng: -87.0850 }, // West area
    { lat: 20.6350, lng: -87.0650 }, // East area
    { lat: 20.6250, lng: -87.0800 }, // Central
    { lat: 20.6400, lng: -87.0700 }, // Northeast
    { lat: 20.6200, lng: -87.0750 }  // Southwest
  ],
  'Cancún': [
    { lat: 21.1619, lng: -86.8515 }, // Hotel Zone
    { lat: 21.1740, lng: -86.8470 }, // Downtown
    { lat: 21.1500, lng: -86.8600 }, // South area
    { lat: 21.1800, lng: -86.8400 }, // North area
    { lat: 21.1650, lng: -86.8450 }, // Central
    { lat: 21.1700, lng: -86.8500 }, // West area
    { lat: 21.1550, lng: -86.8550 }, // East area
    { lat: 21.1750, lng: -86.8350 }, // Northwest
    { lat: 21.1600, lng: -86.8600 }, // Southeast
    { lat: 21.1680, lng: -86.8480 }  // Mid area
  ],
  'Tulum': [
    { lat: 20.2150, lng: -87.4514 }, // Downtown
    { lat: 20.2200, lng: -87.4450 }, // Beach area
    { lat: 20.2100, lng: -87.4600 }, // South area
    { lat: 20.2250, lng: -87.4400 }, // North area
    { lat: 20.2180, lng: -87.4500 }, // Central
    { lat: 20.2120, lng: -87.4550 }, // Southwest
    { lat: 20.2220, lng: -87.4480 }, // Northeast
    { lat: 20.2160, lng: -87.4520 }, // Mid area
    { lat: 20.2140, lng: -87.4490 }, // East area
    { lat: 20.2200, lng: -87.4530 }  // West area
  ],
  'Cozumel': [
    { lat: 20.4229, lng: -86.9223 }, // San Miguel
    { lat: 20.4300, lng: -86.9200 }, // North area
    { lat: 20.4150, lng: -86.9250 }, // South area
    { lat: 20.4250, lng: -86.9180 }, // Central
    { lat: 20.4200, lng: -86.9240 }, // East area
    { lat: 20.4280, lng: -86.9210 }, // Northwest
    { lat: 20.4180, lng: -87.9260 }, // Southeast
    { lat: 20.4240, lng: -86.9230 }, // Mid area
    { lat: 20.4260, lng: -86.9190 }, // Northeast
    { lat: 20.4220, lng: -86.9250 }  // Southwest
  ],
  'Isla Mujeres': [
    { lat: 21.2369, lng: -86.7339 }, // Downtown
    { lat: 21.2400, lng: -86.7300 }, // North area
    { lat: 21.2300, lng: -86.7400 }, // South area
    { lat: 21.2350, lng: -86.7350 }, // Central
    { lat: 21.2380, lng: -86.7320 }, // Northeast
    { lat: 21.2340, lng: -86.7370 }, // Southwest
    { lat: 21.2370, lng: -86.7340 }, // Mid area
    { lat: 21.2390, lng: -86.7310 }, // Northwest
    { lat: 21.2330, lng: -86.7380 }, // Southeast
    { lat: 21.2360, lng: -86.7360 }  // East area
  ],
  'Puerto Morelos': [
    { lat: 20.8470, lng: -86.8755 }, // Downtown
    { lat: 20.8500, lng: -86.8700 }, // North area
    { lat: 20.8400, lng: -86.8800 }, // South area
    { lat: 20.8450, lng: -86.8750 }, // Central
    { lat: 20.8480, lng: -86.8730 }, // Northeast
    { lat: 20.8420, lng: -86.8770 }, // Southwest
    { lat: 20.8460, lng: -86.8760 }, // Mid area
    { lat: 20.8490, lng: -86.8720 }, // Northwest
    { lat: 20.8410, lng: -86.8780 }, // Southeast
    { lat: 20.8440, lng: -86.8740 }  // East area
  ],
  'Puerto Aventuras': [
    { lat: 20.5000, lng: -87.2333 }, // Downtown
    { lat: 20.5050, lng: -87.2300 }, // North area
    { lat: 20.4950, lng: -87.2400 }, // South area
    { lat: 20.5000, lng: -87.2350 }, // Central
    { lat: 20.5030, lng: -87.2320 }, // Northeast
    { lat: 20.4970, lng: -87.2380 }, // Southwest
    { lat: 20.5010, lng: -87.2340 }, // Mid area
    { lat: 20.5040, lng: -87.2310 }, // Northwest
    { lat: 20.4960, lng: -87.2390 }, // Southeast
    { lat: 20.5020, lng: -87.2330 }  // East area
  ],
  'Bacalar': [
    { lat: 18.6783, lng: -88.3883 }, // Downtown
    { lat: 18.6800, lng: -88.3850 }, // North area
    { lat: 18.6750, lng: -88.3900 }, // South area
    { lat: 18.6780, lng: -88.3880 }, // Central
    { lat: 18.6810, lng: -88.3860 }, // Northeast
    { lat: 18.6760, lng: -88.3910 }, // Southwest
    { lat: 18.6790, lng: -88.3870 }, // Mid area
    { lat: 18.6820, lng: -88.3840 }, // Northwest
    { lat: 18.6740, lng: -88.3920 }, // Southeast
    { lat: 18.6770, lng: -88.3890 }  // East area
  ],
  'Holbox': [
    { lat: 21.5444, lng: -87.3806 }, // Downtown
    { lat: 21.5470, lng: -87.3780 }, // North area
    { lat: 21.5400, lng: -87.3850 }, // South area
    { lat: 21.5440, lng: -87.3800 }, // Central
    { lat: 21.5460, lng: -87.3790 }, // Northeast
    { lat: 21.5420, lng: -87.3820 }, // Southwest
    { lat: 21.5450, lng: -87.3810 }, // Mid area
    { lat: 21.5480, lng: -87.3770 }, // Northwest
    { lat: 21.5410, lng: -87.3830 }, // Southeast
    { lat: 21.5430, lng: -87.3810 }  // East area
  ]
}

// Keywords that indicate remote businesses
const remoteKeywords = [
  'remote', 'online', 'virtual', 'digital', 'web', 'internet', 'e-commerce',
  'telephone', 'phone', 'call', 'contact', 'email', 'whatsapp', 'zoom',
  'delivery', 'takeout', 'take-out', 'pickup', 'pick-up'
]

function isRemoteBusiness(affiliate) {
  const text = `${affiliate.name} ${affiliate.description || ''} ${affiliate.address || ''}`.toLowerCase()
  return remoteKeywords.some(keyword => text.includes(keyword))
}

function getRandomCoordinate(city) {
  const coordinates = sampleBusinessCoordinates[city]
  if (!coordinates) {
    // Fallback to city center
    const cityCoord = cityCoordinates[city]
    if (!cityCoord) return null
    
    // Add some random variation around city center
    const latVariation = (Math.random() - 0.5) * 0.01 // ±0.005 degrees
    const lngVariation = (Math.random() - 0.5) * 0.01 // ±0.005 degrees
    
    return {
      lat: cityCoord.lat + latVariation,
      lng: cityCoord.lng + lngVariation
    }
  }
  
  return coordinates[Math.floor(Math.random() * coordinates.length)]
}

async function addCoordinatesToAffiliates() {
  try {
    console.log('🔍 Fetching all affiliates...')
    
    const affiliates = await prisma.affiliate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        city: true,
        location: true,
        description: true,
        address: true
      }
    })
    
    console.log(`📊 Found ${affiliates.length} active affiliates`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    for (const affiliate of affiliates) {
      // Skip if already has coordinates
      if (affiliate.location && affiliate.location.includes(',')) {
        console.log(`⏭️  Skipping ${affiliate.name} - already has coordinates`)
        skippedCount++
        continue
      }
      
      // Skip remote businesses
      if (isRemoteBusiness(affiliate)) {
        console.log(`🏠 Skipping remote business: ${affiliate.name}`)
        skippedCount++
        continue
      }
      
      // Get coordinates based on city
      const city = affiliate.city
      if (!city) {
        console.log(`❓ Skipping ${affiliate.name} - no city specified`)
        skippedCount++
        continue
      }
      
      const coordinates = getRandomCoordinate(city)
      if (!coordinates) {
        console.log(`❌ No coordinates found for city: ${city}`)
        skippedCount++
        continue
      }
      
      // Update affiliate with coordinates
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          location: `${coordinates.lat},${coordinates.lng}`
        }
      })
      
      console.log(`✅ Updated ${affiliate.name} (${city}): ${coordinates.lat}, ${coordinates.lng}`)
      updatedCount++
    }
    
    console.log(`\n📈 Summary:`)
    console.log(`✅ Updated: ${updatedCount} affiliates`)
    console.log(`⏭️  Skipped (already had coordinates): ${skippedCount} affiliates`)
    console.log(`🏠 Remote businesses: ${skippedCount} affiliates`)
    
  } catch (error) {
    console.error('❌ Error adding coordinates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addCoordinatesToAffiliates() 