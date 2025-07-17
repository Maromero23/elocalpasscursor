import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function PassesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="mt-0">
        <div className="bg-orange-500 mt-2 text-center text-white font-bold text-xl sm:text-4xl p-3">
          CHOOSE THE BEST OPTION FOR YOU<br/>
          ENJOY OUR DISCOUNTS!
        </div>
        
        <ul className="md:flex justify-center text-center p-10 sm:p-24">
          {/* BY DAY PASS */}
          <li className="base:m-3 w-full sm:w-1/5 mt-14 rounded m-1">
            <div className="bg-blue-800 text-orange-100 font-bold py-5 px-2 text-base sm:text-xl rounded-3xl z-50 shadow-lg">
              BY DAY PASS
            </div>
            <div className="border-b border-l border-r border-slate-200 hover:border-slate-300 cursor-pointer w-full rounded mt-[-3%] z-10 p-1">
              <p className="mt-5 text-blue-600 font-mono text-xl">PEOPLE</p>
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="block m-auto mt-3 text-2xl text-blue-800" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
              </svg>
              <p className="mt-5 text-orange-400 font-bold text-xl">PROMO</p>
              <p className="mt-1 text-blue-700 text-sm block m-auto w-4/5">Perfect for short visits and day trips</p>
              <div className="flex text-blue-700 justify-center text-2xl">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mt-1" height="30" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
                </svg>
              </div>
              <p className="mt-2 text-orange-300 text-base">Special Price</p>
              <p className="mt-2 text-blue-800 text-base font-bold">$15.00 USD</p>
            </div>
            <button className="bg-green-600 hover:bg-emerald-600 w-4/5 text-white mt-2 p-3 rounded font-bold text-xl">
              Select
            </button>
          </li>

          {/* FULL WEEK PASS - Featured */}
          <li className="base:m-3 w-full sm:w-1/5 mt-14 rounded m-1 relative">
            {/* Featured badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold z-20">
              POPULAR
            </div>
            <div className="bg-blue-600 text-orange-100 font-bold py-5 px-2 text-base sm:text-xl rounded-3xl z-50 shadow-lg border-4 border-blue-400">
              FULL WEEK PASS
            </div>
            <div className="border-b border-l border-r border-blue-400 hover:border-blue-500 cursor-pointer w-full rounded mt-[-3%] z-10 p-1 bg-blue-50">
              <p className="mt-5 text-blue-600 font-mono text-xl">PEOPLE</p>
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="block m-auto mt-3 text-2xl text-blue-800" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
              </svg>
              <p className="mt-5 text-orange-400 font-bold text-xl">PROMO</p>
              <p className="mt-1 text-blue-700 text-sm block m-auto w-4/5">Best value for week-long adventures</p>
              <div className="flex text-blue-700 justify-center text-2xl">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mt-1" height="30" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
                </svg>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mt-1" height="30" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
                </svg>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mt-1" height="30" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
                </svg>
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mt-1" height="30" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
                </svg>
              </div>
              <p className="mt-2 text-orange-300 text-base">Special Price</p>
              <p className="mt-2 text-blue-800 text-base font-bold">$79.90 USD</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 w-4/5 text-white mt-2 p-3 rounded font-bold text-xl">
              Select
            </button>
          </li>

          {/* CUSTOM PASS */}
          <li className="base:m-3 w-full sm:w-1/5 mt-14 rounded m-1">
            <div className="bg-blue-800 text-orange-100 font-bold py-5 px-2 text-base sm:text-xl rounded-3xl z-50 shadow-lg">
              CUSTOM PASS
            </div>
            <div className="border-b border-l border-r border-slate-200 hover:border-slate-300 cursor-pointer w-full rounded mt-[-3%] z-10 p-1">
              <p className="mt-5 text-blue-600 font-mono text-xl">PEOPLE</p>
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="block m-auto mt-3 text-2xl text-blue-800" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
              </svg>
              <p className="mt-5 text-orange-400 font-bold text-xl">PROMO</p>
              <p className="mt-1 text-blue-700 text-sm block m-auto w-4/5">Customize your eLocalPass for your holidays</p>
              <div className="flex text-blue-700 justify-center text-2xl">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="mt-1" height="30" width="30" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"></path>
                </svg>
              </div>
              <p className="mt-2 text-orange-300 text-base">Special Price</p>
              <p className="mt-2 text-blue-800 text-base font-bold">Custom Price</p>
            </div>
            <button className="bg-green-600 hover:bg-emerald-600 w-4/5 text-white mt-2 p-3 rounded font-bold text-xl">
              Select
            </button>
          </li>
        </ul>
      </div>

      <Footer />
    </div>
  )
} 