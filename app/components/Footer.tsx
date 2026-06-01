export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-8 py-6 mt-16">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Nybro Run Club
        </p>
        <a
          href="mailto:loebeklubben@nybro.dk"
          className="text-sm text-gray-400 hover:text-black transition-colors"
        >
          Report a bug →
        </a>
      </div>
    </footer>
  );
}
