'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface QRCodeUsage {
  id: string;
  affiliateName?: string;
  affiliateType?: string;
  discountType?: string;
  discountValue?: string;
  usedAt: string;
  notes?: string;
}

interface QRCodeActivation {
  id: string;
  guests: number;
  days: number;
  cost: number;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface QRCode {
  id: string;
  code: string;
  guests: number;
  days: number;
  cost: number;
  expiresAt: string;
  isActive: boolean;
  landingUrl: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  usage?: QRCodeUsage[];
  activations?: QRCodeActivation[];
  canReactivate?: boolean;
  currentActivation?: QRCodeActivation;
}

interface CustomerData {
  name: string;
  email: string;
  qrCodes: QRCode[];
}

// Loading component for Suspense fallback
function CustomerAccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your ELocalPass...</p>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function CustomerAccessPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState<string | null>(null);
  const [reactivateForm, setReactivateForm] = useState({ guests: 2, days: 3 });

  useEffect(() => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    fetchCustomerData();
  }, [token]);

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/customer/access?token=${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to access customer data');
      }

      const data = await response.json();
      setCustomerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = async (qrCode: string) => {
    try {
      const response = await fetch(`/api/customer/download-qr?code=${qrCode}&token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qrCode}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download QR code');
    }
  };

  const handleReactivate = async (qrCodeId: string) => {
    setReactivating(qrCodeId);
    try {
      const response = await fetch('/api/customer/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          qrCodeId,
          guests: reactivateForm.guests,
          days: reactivateForm.days
        }),
      });

      if (response.ok) {
        // Refresh customer data
        await fetchCustomerData();
        setShowReactivateModal(null);
        setReactivateForm({ guests: 2, days: 3 });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reactivate your ELocalPass. Please try again.');
      }
    } catch (error) {
      console.error('Error reactivating QR code:', error);
      setError('Failed to reactivate your ELocalPass. Please try again.');
    } finally {
      setReactivating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <CustomerAccessLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Please check your email for a valid access link or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {customerData?.name}!
            </h1>
            <p className="text-gray-600">
              Your ELocalPass Dashboard
            </p>
          </div>
        </div>

        {/* QR Codes */}
        <div className="space-y-6">
          {customerData?.qrCodes.map((qrCode) => (
            <div key={qrCode.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 mr-4">
                        {qrCode.code}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        qrCode.isActive && new Date(qrCode.expiresAt) > new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {qrCode.isActive && new Date(qrCode.expiresAt) > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{qrCode.guests}</div>
                        <div className="text-sm text-gray-600">Guests</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{qrCode.days}</div>
                        <div className="text-sm text-gray-600">Days</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-bold text-orange-600">
                          {formatDate(qrCode.expiresAt).split(',')[0]}
                        </div>
                        <div className="text-sm text-gray-600">Expires</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-4">
                      <p><strong>Created:</strong> {formatDate(qrCode.createdAt)}</p>
                      <p><strong>Expires:</strong> {formatDate(qrCode.expiresAt)}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 lg:ml-6 mt-4 lg:mt-0">
                    <div className="text-center">
                      <div className="bg-gray-100 p-4 rounded-lg mb-4">
                        <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center mx-auto mb-2">
                          <svg className="w-24 h-24 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v10H7V7zm2 2v6h6V9H9zm2 2v2h2v-2h-2z"/>
                          </svg>
                        </div>
                        <p className="text-xs text-gray-500">QR Code Preview</p>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => downloadQR(qrCode.code)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Download QR
                        </button>
                        
                        {/* Reactivation Button */}
                        {(!qrCode.isActive || new Date(qrCode.expiresAt) <= new Date()) && (
                          <button
                            onClick={() => setShowReactivateModal(qrCode.id)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            ✨ Reactivate Pass
                          </button>
                        )}
                        
                        {qrCode.landingUrl && (
                          <a
                            href={qrCode.landingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
                          >
                            View Details
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage History Section */}
                {qrCode.usage && qrCode.usage.length > 0 && (
                  <div className="border-t bg-gray-50 p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="mr-2">🏪</span>
                      Usage History ({qrCode.usage.length} visits)
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {qrCode.usage.map((usage) => (
                        <div key={usage.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 mb-1">
                                {usage.affiliateName || 'Partner Location'}
                              </div>
                              {usage.affiliateType && (
                                <div className="text-sm text-gray-600 capitalize mb-1">
                                  {usage.affiliateType}
                                </div>
                              )}
                              {usage.discountType && (
                                <div className="text-sm text-green-600 font-medium mb-1">
                                  {usage.discountType}: {usage.discountValue}
                                </div>
                              )}
                              {usage.notes && (
                                <div className="text-xs text-gray-500 mt-2">
                                  {usage.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 ml-4 text-right">
                              {formatDate(usage.usedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!customerData?.qrCodes || customerData.qrCodes.length === 0) && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Found</h3>
              <p className="text-gray-600">
                You don't have any ELocalPass codes yet. Check your email for new passes or contact support.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at support@elocalpass.com
          </p>
        </div>
      </div>

      {/* Reactivation Modal */}
      {showReactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  ✨ Reactivate Your ELocalPass
                </h3>
                <button
                  onClick={() => setShowReactivateModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Choose your preferences for this activation. You can select different number of guests and days each time you reactivate.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests
                  </label>
                  <select
                    value={reactivateForm.guests}
                    onChange={(e) => setReactivateForm({...reactivateForm, guests: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Days
                  </label>
                  <select
                    value={reactivateForm.days}
                    onChange={(e) => setReactivateForm({...reactivateForm, days: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,14,21,30].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Day' : 'Days'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowReactivateModal(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReactivate(showReactivateModal)}
                  disabled={reactivating === showReactivateModal}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {reactivating === showReactivateModal ? 'Reactivating...' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerAccessPage() {
  return (
    <Suspense fallback={<CustomerAccessLoading />}>
      <CustomerAccessPageContent />
    </Suspense>
  );
} 