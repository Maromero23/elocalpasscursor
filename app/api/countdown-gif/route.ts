import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const expiresParam = searchParams.get('expires')
    
    if (!expiresParam) {
      return new NextResponse('Missing expires parameter', { status: 400 })
    }
    
    const expirationTime = new Date(expiresParam)
    const now = new Date()
    const totalTimeLeft = expirationTime.getTime() - now.getTime()
    
    // If expired, return static "EXPIRED" GIF
    if (totalTimeLeft <= 0) {
      const expiredGif = await generateExpiredGif()
      return new NextResponse(expiredGif, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
    
    // Generate animated countdown GIF
    const countdownGif = await generateCountdownGif(totalTimeLeft)
    
    return new NextResponse(countdownGif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Countdown GIF error:', error)
    
    // Return error GIF
    const errorGif = await generateErrorGif()
    return new NextResponse(errorGif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache'
      }
    })
  }
}

// Generate a simple animated countdown GIF
async function generateCountdownGif(totalTimeLeft: number): Promise<Buffer> {
  // For now, we'll create a simple animated GIF using Canvas API simulation
  // This is a simplified version - in production you'd use a proper GIF library
  
  const hours = Math.floor(totalTimeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((totalTimeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((totalTimeLeft % (1000 * 60)) / 1000)
  
  // Create SVG frames for animation (simplified approach)
  const frames = []
  
  // Generate 10 frames with slight variations to create animation effect
  for (let i = 0; i < 10; i++) {
    const currentSeconds = Math.max(0, seconds - i)
    const displayMinutes = currentSeconds < 0 ? Math.max(0, minutes - 1) : minutes
    const displayHours = displayMinutes < 0 && currentSeconds < 0 ? Math.max(0, hours - 1) : hours
    const displaySeconds = currentSeconds < 0 ? 59 : currentSeconds
    
    const timeString = `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
    
    const svgFrame = `
      <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="60" fill="url(#bg)" stroke="#cbd5e1" stroke-width="2" rx="8"/>
        <text x="100" y="25" font-family="Arial, sans-serif" font-size="12" font-weight="500" text-anchor="middle" fill="#4a5568">
          Time Remaining:
        </text>
        <text x="100" y="45" font-family="Courier New, monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="#2d3748">
          ${timeString}
        </text>
        <circle cx="${190 - i * 2}" cy="15" r="2" fill="#3b82f6" opacity="${0.3 + (i / 10) * 0.7}" />
      </svg>
    `
    frames.push(svgFrame)
  }
  
  // For now, return the first frame as a static image
  // In a full implementation, you'd combine these into an animated GIF
  const staticSvg = frames[0]
  
  // Convert SVG to buffer (simplified - in production use proper image library)
  return Buffer.from(staticSvg, 'utf-8')
}

async function generateExpiredGif(): Promise<Buffer> {
  const expiredSvg = `
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="60" fill="#fee2e2" stroke="#fca5a5" stroke-width="2" rx="8"/>
      <text x="100" y="25" font-family="Arial, sans-serif" font-size="12" font-weight="500" text-anchor="middle" fill="#dc2626">
        Time Remaining:
      </text>
      <text x="100" y="45" font-family="Courier New, monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="#dc2626">
        EXPIRED
      </text>
    </svg>
  `
  return Buffer.from(expiredSvg, 'utf-8')
}

async function generateErrorGif(): Promise<Buffer> {
  const errorSvg = `
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="60" fill="#fee2e2" stroke="#fca5a5" stroke-width="2" rx="8"/>
      <text x="100" y="35" font-family="Arial, sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="#dc2626">
        Timer Error
      </text>
    </svg>
  `
  return Buffer.from(errorSvg, 'utf-8')
} 