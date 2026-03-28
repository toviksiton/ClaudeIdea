'use client'

import { X, ExternalLink, Smartphone, Banknote } from 'lucide-react'

interface PaymentModalProps {
  order: any
  settings: Record<string, string | undefined>
  onClose: () => void
}

export default function PaymentModal({ order, settings, onClose }: PaymentModalProps) {
  const method = order.paymentMethod

  const payboxLink = settings['paybox_link']
    ? `${settings['paybox_link']}?amount=${order.totalAmount}&description=הזמנה+%23${order.id}`
    : null

  const bitPhone = settings['bit_phone'] || settings['business_phone']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl text-gray-800">תשלום</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="text-center mb-5">
          <div className="text-3xl font-bold text-orange-600 mb-1">₪{order.totalAmount}</div>
          <p className="text-gray-500 text-sm">הזמנה #{order.id}</p>
        </div>

        {method === 'PAYBOX' && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">💳</div>
              <p className="font-medium text-gray-800 mb-3">תשלום דרך Paybox</p>
              {payboxLink ? (
                <a
                  href={payboxLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <ExternalLink size={16} />
                  פתח Paybox לתשלום
                </a>
              ) : (
                <p className="text-gray-500 text-sm">קישור Paybox לא הוגדר. פנה לבעל העסק.</p>
              )}
            </div>
          </div>
        )}

        {method === 'BIT' && (
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="font-medium text-gray-800 mb-1">תשלום דרך Bit</p>
              {bitPhone && (
                <>
                  <p className="text-gray-500 text-sm mb-3">
                    שלח ₪{order.totalAmount} לנייד:
                  </p>
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-3 mb-3">
                    <span className="font-bold text-2xl text-purple-700 tracking-wider">{bitPhone}</span>
                  </div>
                  <p className="text-gray-400 text-xs">ציין בהודעה: הזמנה #{order.id}</p>
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors"
        >
          שילמתי / סגור
        </button>

        <p className="text-center text-gray-400 text-xs mt-3">
          ההזמנה תאושר לאחר אישור התשלום
        </p>
      </div>
    </div>
  )
}
