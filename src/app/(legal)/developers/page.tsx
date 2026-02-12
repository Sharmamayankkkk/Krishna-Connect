import { Metadata } from "next";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our Team | Krishna Connect",
  description: "Meet the developers and the inspiration behind Krishna Connect.",
};

// Helper component for team cards
const TeamMemberCard = ({ name, role, imageSrc, initial }: { name: string; role?: string; imageSrc?: string; initial?: string }) => (
  <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all duration-300 hover:border-primary/20 group">
    <div className="w-24 h-24 relative mb-4 rounded-full overflow-hidden bg-muted border-2 border-background ring-2 ring-muted group-hover:ring-primary/20 transition-all">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-2xl font-bold bg-muted">
          {initial || name.charAt(0)}
        </div>
      )}
    </div>
    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h3>
    {role && <p className="text-sm text-muted-foreground font-medium">{role}</p>}
  </div>
);

const DevelopersPage = () => {
  // Developer Data
  const developers = [
    { name: "Mayank Sharma", role: "Frontend & Backend" },
    { name: "Bhavya Shingari", role: "UI/UX Designer" },
    { name: "Himani Vaishnav", role: "Contributor" },
    { name: "Omkar Joshi", role: "Contributor" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Krishna Consciousness Society
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Dedicated to spreading Vedic wisdom through technology.
        </p>
      </div>

      {/* Spiritual Leadership Section */}
      <section className="mb-20">
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px bg-border flex-1 max-w-[100px]" />
          <h2 className="text-2xl font-bold text-center text-foreground">
            Our Inspiration & Leadership
          </h2>
          <div className="h-px bg-border flex-1 max-w-[100px]" />
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-12">

          {/* Srila Prabhupada */}
          <div className="flex flex-col items-center text-center max-w-sm group">
            <div className="w-48 h-48 relative mb-6 rounded-full overflow-hidden border-4 border-primary/10 shadow-xl group-hover:scale-105 transition-transform duration-500">
              <Image
                src="/logo/Srila-Prabhupada.png"
                alt="Srila Prabhupada"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-foreground">His Divine Grace A.C. Bhaktivedanta Swami Prabhupada</h3>
            <p className="text-primary font-medium mt-2">Founder-Acharya: International Society for Krishna Consciousness</p>
          </div>

          {/* HG Gauranga Sundar das */}
          <div className="flex flex-col items-center text-center max-w-sm group">
            <div className="w-40 h-40 relative mb-6 rounded-full overflow-hidden border-4 border-blue-500/10 shadow-lg bg-muted group-hover:scale-105 transition-transform duration-500">
              <Image src="/logo/Gurudev.jpg" alt="HG Gauranga Sundar das" fill className="object-cover" />
            </div>
            <h3 className="text-xl font-bold text-foreground">HG Gauranga Sundar das</h3>
            <p className="text-blue-500 font-medium mt-2">Founder (KCS)</p>
          </div>

        </div>
      </section>

      {/* Developer Team Section */}
      <section>
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px bg-border flex-1 max-w-[100px]" />
          <h2 className="text-2xl font-bold text-center text-foreground">
            Development Team
          </h2>
          <div className="h-px bg-border flex-1 max-w-[100px]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {developers.map((dev, index) => (
            <TeamMemberCard
              key={index}
              name={dev.name}
              role={dev.role}
            />
          ))}
        </div>
      </section>

      <div className="mt-20 text-center text-sm text-muted-foreground border-t border-border pt-8">
        <p>&copy; {new Date().getFullYear()} Krishna Connect. All rights reserved.</p>
      </div>
    </div>
  );
};

export default DevelopersPage;