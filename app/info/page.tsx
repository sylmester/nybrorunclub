export default function InfoPage() {
  return (
    <main className="max-w-2xl mx-auto px-8 py-16">
      <h1 className="text-3xl font-medium mb-2">Nybrogård Running Club</h1>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Welcome</h2>
        <p className="text-gray-600 leading-relaxed">
          Do you feel like running a little (or a lot), meeting new people, and
          maybe finally training for a half marathon? Then Nybrogård Running
          Club is the place for you. Everyone is welcome. We often run together
          towards Bagsværd Stadium, where you can do laps at your own pace, and
          we join various social runs in Lyngby and the surrounding area.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Weekly runs</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We use <strong>Spond</strong> to coordinate our weekly runs and
          events. Sign up for runs, sync events to your calendar, or arrange
          your own run for others to join.
        </p>
        <a
          href="https://spond.com/invite/AZGQT"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors"
        >
          Join on Spond →
        </a>
      </section>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Nybrogård Motionsløb</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Once a year we host Nybrogård Motionsløb — a race around Bagsværd Lake
          with distances of 7, 14, and 21 km. Great atmosphere, local sponsors,
          and runners of all levels. Friends from outside the club are welcome
          too.
        </p>
        <p className="text-gray-600 leading-relaxed mb-6">
          Registration typically opens a few months before the race. Follow us
          on social media or join Spond to be notified when sign-up opens.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="/races"
            className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors w-fit"
          >
            See race results →
          </a>
          <a
            href="/blog"
            className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors w-fit"
          >
            Read the blog →
          </a>
          <div className="flex items-center gap-4 mt-2">
            <a
              href="https://www.facebook.com/groups/1303073057743171"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              Facebook
            </a>
            <a
              href="https://www.instagram.com/nybrorunclub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
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
              Instagram
            </a>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Get involved</h2>
        <p className="text-gray-600 leading-relaxed">
          Interested in helping shape the race or the club? Come join us on a
          run or reach out — we are always happy to have more people involved.
        </p>
      </section>

      <section>
        <h2 className="font-medium mb-3">Contact</h2>
        <a
          href="mailto:loebeklubben@nybro.dk"
          className="text-gray-600 hover:text-black transition-colors"
        >
          loebeklubben@nybro.dk
        </a>
      </section>
    </main>
  );
}
