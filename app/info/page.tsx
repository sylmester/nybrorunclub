export default function InfoPage() {
  return (
    <main className="max-w-2xl mx-auto px-8 py-16">
      <h1 className="text-3xl font-medium mb-2">Nybrogård Running Club</h1>
      <p className="text-gray-500 mb-12">Last updated March 27, 2026</p>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Welcome</h2>
        <p className="text-gray-600 leading-relaxed">
          Do you feel like running a little (or a lot), meeting new people, and
          maybe finally training for a half marathon? Then Nybrogård Running
          Club is the place for you! Everyone is welcome. We often run together
          towards Bagsværd Stadium, where you can do laps at your own pace. We
          also join various social runs in Lyngby and the surrounding area.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Training & events</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We use the app <strong>Spond</strong> to coordinate our runs and
          events. Join us here:
        </p>
        <a
          href="https://spond.com/invite/AZGQT"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors mb-4"
        >
          Join on Spond →
        </a>
        <p className="text-gray-600 leading-relaxed mb-2">
          Through Spond you can:
        </p>
        <ul className="text-gray-600 flex flex-col gap-1 ml-4">
          <li className="before:content-['–'] before:mr-2 before:text-gray-400">
            Sign up for runs
          </li>
          <li className="before:content-['–'] before:mr-2 before:text-gray-400">
            Sync events to your own calendar
          </li>
          <li className="before:content-['–'] before:mr-2 before:text-gray-400">
            Create your own runs for others to join
          </li>
        </ul>
        <p className="text-gray-500 text-sm mt-4">
          We encourage members to join at least once a month — and to
          temporarily leave if you need a break, until you're ready to run
          again.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Annual race — Nybrogård Motionsløb</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Every year we host the Nybrogård Motionsløb. The route goes around
          Bagsværd Lake, where you can run 1, 2, or 3 laps (7, 14, or 21 km).
          Great atmosphere, cheering crowds, and prizes from local sponsors.
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Friends from outside the club are welcome too — they simply pay 30 DKK
          to support the event.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://forms.gle/fS1Gr98i2F6FRyhQ8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors w-fit"
          >
            Sign up for the 2026 race →
          </a>
          <a
            href="https://forms.gle/qMaya5rStq3i9Yfo9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors w-fit"
          >
            Sign up as a volunteer 2026 →
          </a>
          <a
            href="https://www.facebook.com/groups/1303073057743171"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-gray-200 rounded-lg px-4 py-2 text-sm hover:border-gray-400 transition-colors w-fit"
          >
            Facebook group →
          </a>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Want to help build the tradition?</h2>
        <p className="text-gray-600 leading-relaxed">
          Interested in helping shape the annual race or the club itself? Come
          join us on a run or send us a message.
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
