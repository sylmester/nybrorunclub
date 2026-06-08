export default function Footer() {
  return (
    <footer className="border-t border-gray-100 px-8 py-6 mt-16">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Nybrogård Løbeklub
        </p>
        <div className="flex items-center gap-4">
          {/* Facebook */}
          <a
            href="https://www.facebook.com/groups/1303073057743171"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-gray-600 transition-colors"
            title="Facebook"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          {/* Instagram */}
          <a
            href="https://www.instagram.com/nybrorunclub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-gray-600 transition-colors"
            title="Instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle
                cx="17.5"
                cy="6.5"
                r="0.5"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </a>
          <div className="w-px h-3.5 bg-gray-200" />
          <a
            href="mailto:loebeklubben@nybro.dk"
            className="text-sm text-gray-400 hover:text-black transition-colors"
          >
            Contact →
          </a>
        </div>
      </div>
    </footer>
  );
}
