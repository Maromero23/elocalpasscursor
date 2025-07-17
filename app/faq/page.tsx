import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="pt-24">
        <h2 className="text-blues-100 text-4xl font-extrabold text-center mt-7">
          Frequently Asked Questions
        </h2>
        
        <div className="faq-container mt-3 p-3">
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Where can I purchase eLocalPass?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              You can get it online at www.elocalpass.com
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              How much does my eLocalPass cost?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              The cost will be proportional to the number of days and people who wish to enjoy this benefit
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Where can I validate my eLocalPass?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              On our website, you can consult the list of restaurants, stores, and services where you can enjoy our multiple benefits
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Is it only for locals?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              No, eLocalPass is for tourists who are looking for the experience and benefits of a local
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Can I use eLocalPass for more people than the registered?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              For each visit, an eLocalPass holder is registered, and this benefit is extended only to the people selected
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Can I transfer the benefits to someone else?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              It is valid for a group of registered persons; however, one cardholder must be present each time
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Do I get discounts at all restaurants in Quintana Roo with my eLocalPass?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              No, you can enjoy varied discounts in a wide list of places
            </p>
          </div>
          
          <div className="text-center m-2 mt-7">
            <h3 className="text-oranges-200 text-3xl font-bold">
              Do i only need to show QR code to validate my discount?
            </h3>
            <p className="text-blues-100 font-semibold text-2xl mt-1 m-1">
              In most establishments only the QR code will be neccesary, however, we recommed that you carry your ID at all time
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
} 