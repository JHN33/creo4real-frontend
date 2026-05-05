export default function Cancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white text-center px-6">
      <div>
        <h1 className="text-4xl font-bold text-red-500 mb-4">
          Payment Cancelled
        </h1>
        <p className="text-lg text-light-gold/70">
          No worries — you can try again anytime.
        </p>
        <a href="/#donation" className="inline-block mt-6 text-dragon-gold underline">
          Try again
        </a>
      </div>
    </div>
  );
}