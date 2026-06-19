import { useState, useEffect, FormEvent, useRef } from 'react';
import { X, Loader2, Copy, CheckCircle2, Bitcoin, AlertCircle, Upload, FileText, Image } from 'lucide-react';

interface CryptoAddresses {
  btc: string | null;
  usdtTrc20: string | null;
  usdtErc20: string | null;
  eth: string | null;
  sol: string | null;
}

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type CryptoNetwork = 'BTC' | 'USDT-TRC20' | 'USDT-ERC20' | 'ETH' | 'SOL';

const NETWORK_MAP: Record<CryptoNetwork, keyof CryptoAddresses> = {
  'BTC': 'btc',
  'USDT-TRC20': 'usdtTrc20',
  'USDT-ERC20': 'usdtErc20',
  'ETH': 'eth',
  'SOL': 'sol',
};

const NETWORKS: CryptoNetwork[] = ['BTC', 'USDT-TRC20', 'USDT-ERC20', 'ETH', 'SOL'];

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddresses>({ btc: null, usdtTrc20: null, usdtErc20: null, eth: null, sol: null });
  const [cryptoNetwork, setCryptoNetwork] = useState<CryptoNetwork>('USDT-TRC20');
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/payments/crypto/addresses', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setCryptoAddresses(d); setAddressesLoaded(true); })
      .catch(() => setAddressesLoaded(true));
  }, []);

  const currentAddress = cryptoAddresses[NETWORK_MAP[cryptoNetwork]];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const parseAmount = () => {
    const n = parseFloat(amount);
    return isNaN(n) || n <= 0 ? null : n;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setProofBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount();
    if (!amt) { setError('Enter a valid amount'); return; }
    if (!proofBase64 || !proofFile) { setError('Upload your payment proof screenshot or receipt'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/payments/crypto/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          network: cryptoNetwork,
          proofImageBase64: proofBase64,
          proofImageName: proofFile.name,
        }),
        credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) { setError(data.message ?? 'Submission failed'); setLoading(false); return; }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!addressesLoaded) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl w-full max-w-md shadow-2xl p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-brand-surface border border-brand-border rounded-xl w-full max-w-md shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-brand-text font-serif font-bold text-xl mb-2">Deposit Submitted</h2>
          <p className="text-brand-muted font-sans text-sm mb-6">Your deposit and proof of payment are under review. Funds will be credited once confirmed by our team.</p>
          <button onClick={onSuccess} className="bg-brand-gold text-brand-bg font-sans font-bold text-xs px-8 py-3 rounded uppercase tracking-widest hover:brightness-110 transition-all">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-brand-surface border border-brand-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-[2px] bg-brand-gold" />
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-brand-gold" />
            <div>
              <h2 className="text-brand-text font-serif font-bold text-lg">Fund Account</h2>
              <p className="text-brand-muted font-sans text-xs mt-0.5">Crypto deposit — USD only</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 font-sans text-xs">{error}</p>
            </div>
          )}

          {/* Network selector */}
          <div>
            <label className="block text-brand-muted font-sans text-xs mb-2 uppercase tracking-wider font-semibold">Select Network</label>
            <div className="grid grid-cols-3 gap-1.5">
              {NETWORKS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCryptoNetwork(n)}
                  className={`px-2 py-2 rounded text-[11px] font-sans font-medium transition-all border ${
                    cryptoNetwork === n
                      ? 'bg-brand-gold/20 border-brand-gold/60 text-brand-gold'
                      : 'border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-gold/30'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet address */}
          <div>
            <label className="block text-brand-muted font-sans text-xs mb-2 uppercase tracking-wider font-semibold">Send To This Address</label>
            {currentAddress ? (
              <div className="bg-brand-bg border border-brand-gold/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <code className="text-brand-gold text-[11px] font-mono break-all flex-1 leading-relaxed">{currentAddress}</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentAddress, 'addr')}
                    className="shrink-0 mt-0.5 text-brand-muted hover:text-brand-gold transition-colors"
                    title="Copy address"
                  >
                    {copied === 'addr' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-brand-bg border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 font-sans text-xs">Address for {cryptoNetwork} not configured yet. Contact support.</p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-brand-muted font-sans text-xs mb-1 uppercase tracking-wider font-semibold">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold font-bold font-sans">$</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="w-full bg-brand-bg border border-brand-border rounded-lg pl-7 pr-4 py-2.5 text-brand-text font-sans text-sm focus:outline-none focus:border-brand-gold/60"
              />
            </div>
          </div>

          {/* Proof of payment upload */}
          <div>
            <label className="block text-brand-muted font-sans text-xs mb-2 uppercase tracking-wider font-semibold">Proof of Payment</label>
            <p className="text-[10px] text-brand-muted font-sans mb-2">Upload a screenshot or photo of your transaction confirmation.</p>

            {proofFile ? (
              <div className="flex items-center gap-3 bg-brand-bg border border-brand-gold/30 rounded-lg px-3 py-2.5">
                {proofFile.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-brand-gold shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                )}
                <span className="text-xs font-sans text-brand-text flex-1 truncate">{proofFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setProofFile(null); setProofBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-brand-muted hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-brand-border rounded-lg py-4 flex flex-col items-center gap-2 hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all"
              >
                <Upload className="w-5 h-5 text-brand-muted" />
                <span className="text-xs font-sans text-brand-muted">Click to upload proof</span>
                <span className="text-[10px] font-sans text-brand-muted/60">JPG, PNG · Max 5MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="bg-brand-bg border border-brand-border/60 rounded-lg p-3">
            <p className="text-[10px] font-sans text-brand-muted leading-relaxed">
              <span className="text-brand-gold font-bold">Important:</span> Send only {cryptoNetwork} to this address. Funds are credited after 1–3 confirmations and admin review.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !proofFile || !parseAmount()}
            className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3 rounded uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : 'Submit Deposit'}
          </button>
        </form>
      </div>
    </div>
  );
}
