import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="sm:p-24 pt-24 p-2">
        <h1 className="text-orange-600 text-end text-xl sm:text-3xl m-2">
          Contact Us!
        </h1>
        
        <div className="flex items-center gap-5 text-2xl text-blue-600 justify-end mr-3">
          {/* WhatsApp */}
          <svg 
            className="hover:text-amber-500 cursor-pointer" 
            height="1em" 
            width="1em" 
            viewBox="0 0 448 512"
            fill="currentColor"
          >
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
          
          {/* Instagram */}
          <svg 
            className="hover:text-amber-500 cursor-pointer" 
            height="1em" 
            width="1em" 
            viewBox="0 0 448 512"
            fill="currentColor"
          >
            <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
          </svg>
          
          {/* Telegram */}
          <svg 
            className="hover:text-amber-500 cursor-pointer" 
            height="1em" 
            width="1em" 
            viewBox="0 0 496 512"
            fill="currentColor"
          >
            <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z" />
          </svg>
          
          {/* Facebook */}
          <svg 
            className="hover:text-amber-500 cursor-pointer" 
            height="1em" 
            width="1em" 
            viewBox="0 0 512 512"
            fill="currentColor"
          >
            <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
          </svg>
        </div>
        
        <div className="sm:flex">
          <div className="w-fit">
            <div className="p-2 m-2">
              <h3 className="text-orange-500 font-bold">GETTING HERE:</h3>
              <p className="mt-3">
                Quinta Avenida #25 Suite 23 Playa del Carmen, CP 77710
              </p>
            </div>
            
            <div className="p-2 m-2">
              <h3 className="text-orange-500 font-bold">CONTACT US:</h3>
              <p className="mt-3">
                Tel: +52 1 984 211 0483
              </p>
            </div>
            
            <div className="p-2 m-2">
              <h3 className="text-orange-500 font-bold">EMAIL:</h3>
              <p className="mt-3 text-blue-500">
                info@elocalpass.com
              </p>
            </div>
          </div>
          
          <div className="sm:w-3/5 w-full">
            <div className="lds-dual-ring"></div>
          </div>
          
          <form className="p-3 mt-5 sm:w-1/2 w-full">
            <div className="block">
              <label htmlFor="name">Your Name(required)</label>
              <input 
                className="block border border-slate-300 p-1 rounded" 
                type="text" 
                id="name" 
                name="name" 
              />
            </div>
            
            <div className="block mx-auto mt-5">
              <label htmlFor="email">Your Email(required)</label>
              <input 
                className="block border border-slate-300 p-1 rounded w-1/2" 
                type="email" 
                id="email" 
                name="email" 
              />
            </div>
            
            <div className="block mx-auto mt-5">
              <label htmlFor="message">Your Message</label>
              <textarea 
                className="block border border-sky-700 w-2/3 rounded" 
                id="message" 
                name="message"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="bg-slate-300 text-white p-2 block mx-auto mt-5 hover:bg-blue-500 rounded"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
} 