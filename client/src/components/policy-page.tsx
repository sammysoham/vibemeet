import Link from "next/link";

type PolicySection = {
  title: string;
  body: string;
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
};

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: PolicyPageProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,111,111,0.18),_transparent_20%),radial-gradient(circle_at_88%_10%,_rgba(88,193,255,0.2),_transparent_18%),linear-gradient(180deg,_#fff8ef_0%,_#fff4ec_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl rounded-[2.4rem] border border-[#ecd7ca] bg-white/82 p-6 shadow-[0_30px_90px_rgba(238,148,104,0.14)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="text-sm text-[#ff6b6b] hover:text-[#2b1f45]">
          Back to VibeMeet
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-[#ff6b6b]/70">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#2b1f45]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#64597e]">{intro}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.8rem] border border-[#edd8cb] bg-[#fffaf6] p-5"
            >
              <h2 className="text-xl font-semibold text-[#2b1f45]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#64597e]">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
