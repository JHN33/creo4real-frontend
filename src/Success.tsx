export default function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white text-center px-6">
      <div>
        <h1 className="text-4xl font-bold text-dragon-gold mb-4">
          Thank you for your donation 🙏
        </h1>
        <p className="text-lg text-light-gold/70">
          Your support helps CREO4REAL grow and inspire more people.
        </p>
        <a href="/" className="inline-block mt-6 text-dragon-gold underline">
          Go back home
        </a>
      </div>
    </div>
  );
}