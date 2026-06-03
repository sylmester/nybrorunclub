import Image from "next/image";

interface Sponsor {
  name: string;
  url: string;
  logo?: string;
  priority: number;
  bg?: string;
  invert?: boolean;
}

const sponsors: Sponsor[] = [
  {
    name: "Madklubber",
    url: "https://www.madklubber.dk",
    logo: "https://www.madklubber.dk/favicon-128x128.png",
    priority: 1,
  },
  {
    name: "Sophienholm",
    url: "https://sophienholm.dk",
    logo: "https://sophienholm.dk/favicon.ico",
    priority: 2,
  },
  {
    name: "Den helt rigtige Bager",
    url: "https://denheltrigtigebager.dk/",
    logo: "https://denheltrigtigebager.dk/File/0feb5528-3610-46e5-bd55-72d658e54514/logo.png",
    priority: 5,
    invert: true,
  },
  {
    name: "Løberen",
    url: "https://loberen.dk",
    logo: "https://loberen.dk/media/logo/stores/2/logo.png",
    priority: 3,
  },
  // {
  //   name: "Sport 24",
  //   url: "https://sport24.dk",
  //   logo: "https://www.sport24.dk/_next/image/?url=%2Fsport24-logo.png&w=256&q=70",
  //   priority: 5,
  // },
  // {
  //   name: "Friluftsland",
  //   url: "https://www.friluftsland.dk/",
  //   logo: "https://tse1.mm.bing.net/th/id/OIP.LVonkv074DqlauXEQ_wwbQAAAA?cb=thfvnextfalcon&pid=Api",
  //   priority: 6,
  // },
  {
    name: "FDB Møbler",
    url: "https://fdbmobler.dk",
    logo: "https://www.fdbmobler.dk/cdn/shop/files/logo_FDB_hvid.png?v=1718711163&width=160",
    priority: 7,
    invert: true,
  },
  // {
  //   name: "Faraos Cigarer",
  //   url: "https://www.faraos.dk/",
  //   logo: "https://www.faraos.dk/assets/images/logo-large.png",
  //   priority: 8,
  // },
  {
    name: "Føtex",
    url: "https://foetex.dk",
    logo: "https://www.foetex.dk/_nuxt/img/37fd1d3.svg",
    priority: 4,
  },
];

export default function SponsorBar() {
  const sorted = [...sponsors].sort((a, b) => a.priority - b.priority);
  // Duplicate for seamless loop
  const items = [...sorted, ...sorted, ...sorted];

  return (
    <div className="border-t border-b border-gray-100 py-6 overflow-hidden">
      <p className="text-xs text-gray-400 uppercase tracking-wide text-center mb-5">
        Supported by
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex animate-sponsor-scroll">
          {items.map((sponsor, i) => (
            <a
              key={i}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 mx-12 shrink-0 group"
            >
              {sponsor.logo && (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={100}
                  height={100}
                  className="opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: sponsor.bg || "transparent",
                    padding: "4px",
                    borderRadius: "4px",
                    filter: sponsor.invert ? "invert(1)" : undefined,
                  }}
                />
              )}
              {/* <span className="text-gray-400 group-hover:text-gray-700 transition-colors font-medium text-sm whitespace-nowrap">
                {sponsor.name}
              </span> */}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
