import PaymentModal from '@/components/billing/PaymentModal';

// ... inside BillingPage ...

// Payment Modal State
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
};

const handlePaymentSuccess = () => {
    fetchData();
    toast.success(getLabel('uploadSuccess'));
};

// ... inside render ...

<td className="px-4 py-3 text-right">
    {inv.status === 'PENDING' && (
        <button
            onClick={() => handlePayClick(inv)}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
        >
            <CreditCard className="w-3 h-3" /> {getLabel('action') === 'Aksi' ? 'Bayar' : 'Pay'}
        </button>
    )}
    {(inv.status === 'VERIFYING' || (inv.paymentProof && inv.status !== 'PENDING')) && (
        <span className="text-xs text-slate-500 italic flex items-center justify-end gap-1">
            <FileText className="w-3 h-3" /> {getLabel('proofUploaded')}
        </span>
    )}
    {inv.status === 'REJECTED' && (
        <button
            onClick={() => handlePayClick(inv)}
            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium text-xs bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-100"
        >
            <Upload className="w-3 h-3" /> Re-Upload
        </button>
    )}
</td>

// ... Remove the "Payment Instructions Side Panel" or simplify it ...

{/* Payment Instructions Side Panel - Simplified or Removed since Modal handles it */ }
<div>
    {/* You can keep a summary or remove it. Let's keep a small banner instead. */}
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white p-6 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-24 h-24 transform rotate-12" />
        </div>
        <h3 className="font-bold text-lg mb-2 relative z-10">Premium Support</h3>
        <p className="text-indigo-100 text-sm mb-4 relative z-10">
            {language === 'id' ? 'Butuh bantuan pembayaran? Hubungi kami.' : 'Need help with payment? Contact us.'}
        </p>
        <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors relative z-10">
            WhatsApp Support
        </button>
    </div>
</div>

// ... inside return ...

{/* PAYMENT MODAL */ }
{
    selectedInvoice && (
        <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            invoiceId={selectedInvoice.id}
            invoiceNumber={selectedInvoice.invoiceNumber}
            amount={selectedInvoice.amount}
            onUploadSuccess={handlePaymentSuccess}
        />
    )
}
        </div >
    );
}

function FeatureItem({ label, included = true }: { label: string; included?: boolean }) {
    return (
        <div className={`flex items-start gap-2 text-sm ${included ? 'text-gray-700' : 'text-gray-400'}`}>
            {included ? (
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
                <X className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            )}
            <span>{label}</span>
        </div>
    );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 15 : Math.min(100, (used / limit) * 100);
    const isNearLimit = !isUnlimited && percentage >= 85;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">{label}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isNearLimit ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {used} / {isUnlimited ? '∞' : limit}
                </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
