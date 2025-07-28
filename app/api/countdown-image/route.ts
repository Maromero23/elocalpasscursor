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
    
    // Generate HTML-based countdown image (more email client compatible)
    const htmlImage = `
      <div style="
        width: 200px; 
        height: 60px; 
        background: linear-gradient(to right, #f8fafc, #e2e8f0);
        border: 2px solid #cbd5e1;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: Arial, sans-serif;
        text-align: center;
        box-sizing: border-box;
      ">
        <div style="
          font-size: 12px;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 4px;
        ">Time Remaining:</div>
        <div style="
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          color: ${timeLeft <= 0 ? '#dc2626' : '#2d3748'};
        ">${timeLeft <= 0 ? 'EXPIRED' : timeString}</div>
      </div>
    `
    
    return new NextResponse(htmlImage, {
      headers: {
        'Content-Type': 'text/html',
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