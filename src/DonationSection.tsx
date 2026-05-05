import { useEffect, useMemo, useState } from "react";

type CryptoDepositOption = {
  label: string;
  network: string;
  address: string;
};

type DonationConfig = {
  currency: string;
  stripeFeePercent: number;
  stripeFixedFee: number;
  cryptoDeposits: CryptoDepositOption[];
  minimumDonation: number;
};

type CryptoPaymentSession = {
  paymentId: string;
  status: "waiting" | "detected" | "confirmed" | "expired" | "failed";
  message: string;
  depositAddress: string;
  network: string;
  token: string;
  expectedTokenAmount: string;
  donationAmount: number;
  expiresAt: string;
  transactionUrl?: string;
  amountReceived?: string;
};

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "https://creo4real-backend.onrender.com").replace(/\/$/, "");

const readJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `The payment server returned HTML instead of JSON. Check that VITE_BACKEND_URL points to the backend API. Current API URL: ${API_BASE_URL}. Response status: ${response.status}.`
    );
  }

  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new Error("The payment server returned an invalid JSON response.");
  }
};

const fallbackConfig: DonationConfig = {
  currency: "EUR",
  stripeFeePercent: 1.5,
  stripeFixedFee: 0.25,
  cryptoDeposits: [
    {
      label: "USDT (TRC20)",
      network: "TRON (TRC20)",
      address: "TAVrMDcewAwwpPF8yuugtKsWu7SUpQa5fJ",
    },
  ],
  minimumDonation: 1,
};

const formatCurrency = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export default function DonationSection() {
  const [amount, setAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<DonationConfig>(fallbackConfig);
  const [selectedCryptoIndex, setSelectedCryptoIndex] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState(fallbackConfig.cryptoDeposits[0].network);
  const [creatingCryptoPayment, setCreatingCryptoPayment] = useState(false);
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPaymentSession | null>(null);
  const [cryptoStatusLoading, setCryptoStatusLoading] = useState(false);

  const presetAmounts = [5, 10, 25, 50, 100, 250];

  useEffect(() => {
    const loadDonationConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/donation-config`);
        const data = await readJsonResponse(res);

        setConfig({
          currency: data.currency || fallbackConfig.currency,
          stripeFeePercent: Number(data.stripeFeePercent ?? fallbackConfig.stripeFeePercent),
          stripeFixedFee: Number(data.stripeFixedFee ?? fallbackConfig.stripeFixedFee),
          cryptoDeposits: Array.isArray(data.cryptoDeposits) && data.cryptoDeposits.length
            ? data.cryptoDeposits
            : fallbackConfig.cryptoDeposits,
          minimumDonation: Number(data.minimumDonation ?? fallbackConfig.minimumDonation),
        });
      } catch (error) {
        console.warn("Donation config unavailable, using defaults.", error);
      }
    };

    loadDonationConfig();
  }, []);

  const processingFee = useMemo(() => {
    return amount * (config.stripeFeePercent / 100) + config.stripeFixedFee;
  }, [amount, config.stripeFeePercent, config.stripeFixedFee]);

  const estimatedNetDonation = Math.max(amount - processingFee, 0);
  const selectedCryptoDeposit = config.cryptoDeposits[selectedCryptoIndex] || fallbackConfig.cryptoDeposits[0];
  const availableNetworks = Array.from(new Set(config.cryptoDeposits.map((deposit) => deposit.network)));
  const cryptoQrPayload = cryptoPayment
    ? `${cryptoPayment.depositAddress}?token=${cryptoPayment.token}&network=${encodeURIComponent(cryptoPayment.network)}&amount=${cryptoPayment.expectedTokenAmount}`
    : selectedCryptoDeposit.address;
  const cryptoQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(cryptoQrPayload)}`;

  useEffect(() => {
    if (selectedCryptoDeposit?.network) {
      setSelectedNetwork(selectedCryptoDeposit.network);
    }
  }, [selectedCryptoDeposit]);

  const copyCryptoAddress = async () => {
    const addressToCopy = cryptoPayment?.depositAddress || selectedCryptoDeposit.address;
    try {
      await navigator.clipboard.writeText(addressToCopy);
      alert("Crypto deposit address copied.");
    } catch (error) {
      console.error("Clipboard error:", error);
      alert("Please copy the crypto deposit address manually.");
    }
  };

  const copyCryptoAmount = async () => {
    if (!cryptoPayment?.expectedTokenAmount) return;

    try {
      await navigator.clipboard.writeText(cryptoPayment.expectedTokenAmount);
      alert("Exact crypto amount copied.");
    } catch (error) {
      console.error("Clipboard error:", error);
      alert("Please copy the exact amount manually.");
    }
  };

  const formatExpiryTime = (expiresAt?: string) => {
    if (!expiresAt) return "";
    return new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCheckout = async () => {
    if (!amount || amount < config.minimumDonation) {
      alert(`Please enter a donation of at least ${formatCurrency(config.minimumDonation, config.currency)}.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(amount),
            type: "payment",
          }),
        }
      );

      const data = await readJsonResponse(res);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert(data?.error || "Unable to start checkout session.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const createCryptoPayment = async () => {
    if (!amount || amount < config.minimumDonation) {
      alert(`Please enter a donation of at least ${formatCurrency(config.minimumDonation, config.currency)}.`);
      return;
    }

    setCreatingCryptoPayment(true);
    setCryptoPayment(null);

    try {
      const res = await fetch(`${API_BASE_URL}/create-crypto-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          depositAddress: selectedCryptoDeposit.address,
          network: selectedNetwork,
          currency: config.currency,
        }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok || data?.status === "failed") {
        throw new Error(data?.message || "Unable to create crypto payment.");
      }

      setCryptoPayment(data);
    } catch (error) {
      console.error("Crypto payment creation error:", error);
      alert(error instanceof Error ? error.message : "Unable to create crypto payment.");
    } finally {
      setCreatingCryptoPayment(false);
    }
  };

  const refreshCryptoPaymentStatus = async (paymentId = cryptoPayment?.paymentId) => {
    if (!paymentId) return;

    setCryptoStatusLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/crypto-payment-status/${paymentId}`);
      const data = await readJsonResponse(res);
      setCryptoPayment(data);
    } catch (error) {
      console.error("Crypto status error:", error);
      setCryptoPayment((current) => current ? {
        ...current,
        status: "failed",
        message: "Unable to refresh blockchain status right now. Please try again.",
      } : current);
    } finally {
      setCryptoStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!cryptoPayment?.paymentId) return;
    if (["confirmed", "expired", "failed"].includes(cryptoPayment.status)) return;

    const timer = window.setInterval(() => {
      refreshCryptoPaymentStatus(cryptoPayment.paymentId);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [cryptoPayment?.paymentId, cryptoPayment?.status]);

  return (
    <section
      id="donation"
      className="py-20 px-6 bg-gradient-to-b from-deep-black/50 to-dragon-black"
    >
      <div className="max-w-3xl mx-auto text-center">

        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          SUPPORT THE <span className="text-dragon-gold">MISSION</span>
        </h2>

        <p className="text-xl text-light-gold/70 mb-10 leading-relaxed">
          Your support to CREO4REAL helps us grow together. It allows us to create more motivational content,
          better livestream quality, a stronger community that inspires people worldwide and transforms many lives.
          This is bigger than one person. This is a movement. Thank you for helping this grow.
        </p>

        <p className="text-xl text-light-gold/70 mb-10 leading-relaxed">
          Become a part of this mission today!
        </p>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {presetAmounts.map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value)}
              className={`py-3 border font-bold rounded-sm transition-all ${
                amount === value
                  ? "bg-dragon-gold text-black"
                  : "border-dragon-gold text-dragon-gold hover:bg-dragon-gold/10"
              }`}
            >
              {formatCurrency(value, config.currency).replace(".00", "")}
            </button>
          ))}
        </div>

        <p className="text-light-gold/70 mb-3 text-sm tracking-wide">
          Choose a preset amount or type any amount you want to donate
        </p>

        <div className="mb-6">
          <input
            type="number"
            min={config.minimumDonation}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full text-center text-2xl py-4 bg-deep-black border border-dragon-gold/30 focus:border-dragon-gold outline-none rounded-sm text-dragon-gold"
            placeholder={`Enter your donation amount (${config.currency})`}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
          <div className="border border-dragon-gold/20 bg-deep-black/60 p-4 rounded-sm">
            <p className="text-light-gold/50 text-sm uppercase tracking-widest">Your chosen donation</p>
            <p className="text-2xl font-bold text-dragon-gold">{formatCurrency(amount, config.currency)}</p>
          </div>
          <div className="border border-dragon-gold/20 bg-deep-black/60 p-4 rounded-sm">
            <p className="text-light-gold/50 text-sm uppercase tracking-widest">Processing fees</p>
            <p className="text-2xl font-bold text-dragon-gold">{formatCurrency(processingFee, config.currency)}</p>
            <p className="text-xs text-light-gold/50 mt-1">
              Estimate: {config.stripeFeePercent}% + {formatCurrency(config.stripeFixedFee, config.currency)}
            </p>
          </div>
          <div className="border border-dragon-gold/20 bg-deep-black/60 p-4 rounded-sm">
            <p className="text-light-gold/50 text-sm uppercase tracking-widest">Estimated received</p>
            <p className="text-2xl font-bold text-dragon-gold">{formatCurrency(estimatedNetDonation, config.currency)}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-dragon-gold text-deep-black py-4 font-bold hover:bg-light-gold transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : `Donate ${formatCurrency(amount, config.currency)} with Card`}
          </button>

          <p className="text-light-gold/50 text-sm">
            Card checkout will show available secure payment methods automatically when available.
          </p>

          <div className="border border-dragon-gold/30 bg-deep-black/70 p-5 rounded-sm text-left">
            <h3 className="text-2xl font-bold text-dragon-gold mb-3 text-center">
              Automatic Crypto Donation
            </h3>
            <p className="text-light-gold/60 text-sm mb-6 text-center">
              Enter any donation amount you want. The website adds a tiny unique identifier to the crypto amount so it can detect your payment automatically. No TXID is needed.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-light-gold/50 text-sm uppercase tracking-widest mb-2">Step 1: Select deposit address</p>
                <select
                  id="crypto-deposit"
                  value={selectedCryptoIndex}
                  onChange={(event) => setSelectedCryptoIndex(Number(event.target.value))}
                  className="w-full bg-deep-black border border-dragon-gold/40 text-dragon-gold p-3 rounded-sm outline-none focus:border-dragon-gold"
                >
                  {config.cryptoDeposits.map((deposit, index) => (
                    <option key={`${deposit.network}-${deposit.address}`} value={index}>
                      {deposit.label} — {deposit.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-light-gold/50 text-sm uppercase tracking-widest mb-2">Step 2: Choose network</p>
                <select
                  id="crypto-network"
                  value={selectedNetwork}
                  onChange={(event) => setSelectedNetwork(event.target.value)}
                  className="w-full bg-deep-black border border-dragon-gold/40 text-dragon-gold p-3 rounded-sm outline-none focus:border-dragon-gold"
                >
                  {availableNetworks.map((network) => (
                    <option key={network} value={network}>
                      {network}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={createCryptoPayment}
                disabled={creatingCryptoPayment}
                className="w-full bg-dragon-gold text-deep-black py-4 font-bold hover:bg-light-gold transition-all disabled:opacity-50 rounded-sm"
              >
                {creatingCryptoPayment ? "Creating Payment..." : "Step 3: Generate Payment for My Amount"}
              </button>

              {cryptoPayment && (
                <div className="border border-dragon-gold/20 bg-dragon-black/50 p-4 rounded-sm space-y-4 text-light-gold/80 text-sm">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-light-gold/50 uppercase tracking-widest text-xs">Exact crypto amount to send</p>
                      <p className="text-3xl font-bold text-dragon-gold">
                        {cryptoPayment.expectedTokenAmount} {cryptoPayment.token}
                      </p>
                      <p className="text-light-gold/50 text-xs mt-1">
                        This equals your chosen donation amount plus a tiny unique identifier for automatic detection.
                      </p>
                    </div>
                    <div>
                      <p className="text-light-gold/50 uppercase tracking-widest text-xs">Status</p>
                      <p className="text-2xl font-bold text-dragon-gold capitalize">{cryptoPayment.status}</p>
                      <p className="text-light-gold/50 text-xs mt-1">Expires around {formatExpiryTime(cryptoPayment.expiresAt)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[180px_1fr] gap-4 items-center">
                    <div className="bg-white p-3 rounded-sm w-fit mx-auto md:mx-0">
                      <img
                        src={cryptoQrCodeUrl}
                        alt="USDT TRC20 donation QR code"
                        className="w-40 h-40"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="break-all">
                        <p className="text-light-gold/50 uppercase tracking-widest text-xs mb-1">Deposit address</p>
                        <p className="text-dragon-gold font-bold">{cryptoPayment.depositAddress}</p>
                      </div>

                      <div>
                        <p className="text-light-gold/50 uppercase tracking-widest text-xs mb-1">Network</p>
                        <p className="text-dragon-gold font-bold">{cryptoPayment.network}</p>
                      </div>

                      <p className="text-light-gold/60 text-xs leading-relaxed">
                        Scan the QR code, then confirm your wallet is sending <strong>USDT</strong> on <strong>TRON/TRC20</strong> and enter the exact amount shown above.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={copyCryptoAmount}
                      className="w-full border border-dragon-gold text-dragon-gold py-3 font-bold hover:bg-dragon-gold hover:text-deep-black transition-all rounded-sm"
                    >
                      Copy Exact Amount
                    </button>
                    <button
                      type="button"
                      onClick={copyCryptoAddress}
                      className="w-full border border-dragon-gold text-dragon-gold py-3 font-bold hover:bg-dragon-gold hover:text-deep-black transition-all rounded-sm"
                    >
                      Copy Deposit Address
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => refreshCryptoPaymentStatus()}
                    disabled={cryptoStatusLoading || ["confirmed", "expired", "failed"].includes(cryptoPayment.status)}
                    className="w-full bg-dragon-gold text-deep-black py-3 font-bold hover:bg-light-gold transition-all disabled:opacity-50 rounded-sm"
                  >
                    {cryptoStatusLoading ? "Checking Blockchain..." : "Refresh Payment Status"}
                  </button>

                  <div className={`border p-4 rounded-sm ${
                    cryptoPayment.status === "confirmed"
                      ? "border-green-500/50 text-green-300 bg-green-500/10"
                      : cryptoPayment.status === "detected"
                        ? "border-yellow-500/50 text-yellow-200 bg-yellow-500/10"
                        : cryptoPayment.status === "expired" || cryptoPayment.status === "failed"
                          ? "border-red-500/50 text-red-200 bg-red-500/10"
                          : "border-dragon-gold/30 text-light-gold/80 bg-deep-black/40"
                  }`}>
                    <p className="font-bold uppercase tracking-widest mb-2">{cryptoPayment.status}</p>
                    <p>{cryptoPayment.message}</p>
                    {cryptoPayment.amountReceived && (
                      <p className="mt-2">Amount received: {cryptoPayment.amountReceived} {cryptoPayment.token}</p>
                    )}
                    {cryptoPayment.transactionUrl && (
                      <a
                        href={cryptoPayment.transactionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-dragon-gold underline"
                      >
                        Open transaction on Tronscan
                      </a>
                    )}
                  </div>

                  <p className="text-light-gold/50 text-xs">
                    Send only USDT on the TRON (TRC20) network. Payments sent as TRX, another token, a wrong network, or with the wrong amount may not be detected automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-light-gold/40 text-sm mt-8">
          Donors can choose any amount. Crypto payments must be sent as the exact generated amount so the system can match the donation automatically.
        </p>

        <div className="mt-16 text-center">

          <h3 className="text-3xl md:text-4xl font-bold text-dragon-gold mb-4 tracking-wide">
            STOP WAITING. START BUILDING.
          </h3>

          <p className="text-xl text-light-gold/80 mb-8">
            Create your own reality today.
          </p>

          <a
            href="#merch"
            className="inline-block px-8 py-3 bg-dragon-gold text-deep-black font-bold hover:bg-light-gold transition-all rounded-sm"
          >
            JOIN THE MOVEMENT
          </a>

        </div>

      </div>
    </section>
  );
}
