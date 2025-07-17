import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function PassesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="mt-0 pt-20">
        <div className="bg-oranges-100 mt-2 text-center text-white font-bold text-xl sm:text-4xl p-3">
          CHOOSE THE BEST OPTION FOR YOU<br/>
          ENJOY OUR DISCOUNTS!
        </div>
        
        <ul className="md:flex justify-center text-center p-10 sm:p-24">
          {/* 4 Days Pass */}
          <li className="base:m-3 w-full sm:w-1/5 mt-14 rounded m-1">
            <div className="fondo_blue_2 text-oranges-100 font-bold py-5 px-2 text-base sm:text-xl rounded-3xl z-50 text_shadow bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
              eLocalPass<br/>4 days
            </div>
            <div className="border-b border-l border-r border-slate-200 hover:border-slate-300 cursor-pointer w-full rounded mt-[-3%] z-10 p-1 bg-white">
              <p className="mt-5 text-blue-600 font-mono text-xl">PEOPLE</p>
              <svg 
                className="block m-auto mt-3 text-2xl text-blue-800" 
                height="1em" 
                width="1em" 
                viewBox="0 0 640 512"
                fill="currentColor"
              >
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
              </svg>
              <p className="mt-5 text-orange-400 font-bold text-xl">PROMO</p>
              <p className="mt-1 text-blues-100 text-sm block m-auto w-4/5">
                Get unlimited discounts up to 4 people
              </p>
              <div className="flex text-blue-700 justify-center text-2xl">
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                </svg>
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                </svg>
              </div>
              <p className="mt-2 text-orange-300 text-base">Special Price</p>
              <p className="mt-2 text-blue-800 text-base font-bold">59.90 USD</p>
            </div>
            <button className="bg-green-600 hover:bg-emerald-600 w-4/5 text-white mt-2 p-3 rounded font-bold text-xl">
              Select
            </button>
          </li>

          {/* 7 Days Pass */}
          <li className="base:m-3 w-full sm:w-1/5 mt-14 rounded m-1">
            <div className="fondo_blue_2 text-oranges-100 font-bold py-5 px-2 text-base sm:text-xl rounded-3xl z-50 text_shadow bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
              eLocalPass<br/>7 days
            </div>
            <div className="border-b border-l border-r border-slate-200 hover:border-slate-300 cursor-pointer w-full rounded mt-[-3%] z-10 p-1 bg-white">
              <p className="mt-5 text-blue-600 font-mono text-xl">PEOPLE</p>
              <svg 
                className="block m-auto mt-3 text-2xl text-blue-800" 
                height="1em" 
                width="1em" 
                viewBox="0 0 640 512"
                fill="currentColor"
              >
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
              </svg>
              <p className="mt-5 text-orange-400 font-bold text-xl">PROMO</p>
              <p className="mt-1 text-blues-100 text-sm block m-auto w-4/5">
                Get unlimited discounts up to 8 people
              </p>
              <div className="flex text-blue-700 justify-center text-2xl">
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                </svg>
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                </svg>
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                </svg>
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                </svg>
              </div>
              <p className="mt-2 text-orange-300 text-base">Special Price</p>
              <p className="mt-2 text-blue-800 text-base font-bold">79.90 USD</p>
            </div>
            <button className="bg-green-600 hover:bg-emerald-600 w-4/5 text-white mt-2 p-3 rounded font-bold text-xl">
              Select
            </button>
          </li>

          {/* Custom Pass */}
          <li className="base:m-3 w-full sm:w-1/5 mt-14 rounded m-1">
            <div className="fondo_blue_2 text-oranges-100 font-bold py-5 px-2 text-base sm:text-xl rounded-3xl z-50 text_shadow bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
              eLocalPass<br/>Personalized days
            </div>
            <div className="border-b border-l border-r border-slate-200 hover:border-slate-300 cursor-pointer w-full rounded mt-[-3%] z-10 p-1 bg-white">
              <p className="mt-5 text-blue-600 font-mono text-xl">PEOPLE</p>
              <svg 
                className="block m-auto mt-3 text-2xl text-blue-800" 
                height="1em" 
                width="1em" 
                viewBox="0 0 640 512"
                fill="currentColor"
              >
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
              </svg>
              <p className="mt-5 text-orange-400 font-bold text-xl">PROMO</p>
              <p className="mt-1 text-blues-100 text-sm block m-auto w-4/5">
                Customize your eLocalPass for your holidays
              </p>
              <div className="flex text-blue-700 justify-center text-2xl">
                <svg className="mt-1" height="30" width="30" viewBox="0 0 640 512" fill="currentColor">
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
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