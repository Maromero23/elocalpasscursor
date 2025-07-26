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
    const timeLeft = expirationTime.getTime() - now.getTime()
    
    let hours = 0
    let minutes = 0
    let seconds = 0
    
    if (timeLeft > 0) {
      hours = Math.floor(timeLeft / (1000 * 60 * 60))
      minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
      seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
    }
    
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    
    // Generate SVG countdown image
    const svg = `
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
        <text x="100" y="45" font-family="Courier New, monospace" font-size="18" font-weight="bold" text-anchor="middle" fill="${timeLeft <= 0 ? '#dc2626' : '#2d3748'}">
          ${timeLeft <= 0 ? 'EXPIRED' : timeString}
        </text>
      </svg>
    `
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Countdown image error:', error)
    
    // Return error image
    const errorSvg = `
      <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="60" fill="#fee2e2" stroke="#fca5a5" stroke-width="2" rx="8"/>
        <text x="100" y="35" font-family="Arial, sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="#dc2626">
          Timer Error
        </text>
      </svg>
    `
    
    return new NextResponse(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    })
  }
} 