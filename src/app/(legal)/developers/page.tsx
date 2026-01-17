import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Our Team | Krishna Consciousness Society",
  description: "Meet the developers and the inspiration behind the project.",
};

// Helper component for team cards to keep code clean
const TeamMemberCard = ({ name, role, imageSrc }: { name: string; role?: string; imageSrc?: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300">
    <div className="w-24 h-24 relative mb-4 rounded-full overflow-hidden bg-gray-200">
      {imageSrc ? (
        <Image 
          src={imageSrc} 
          alt={name} 
          fill 
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
          {name.charAt(0)}
        </div>
      )}
    </div>
    <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
    {role && <p className="text-sm text-blue-600 font-medium">{role}</p>}
  </div>
);

const DevelopersPage = () => {
  // Developer Data
  const developers = [
    "Mayank Sharma",
    "Bhavya Shingari",
    "Himani Vaishnav",
    "Omkar Joshi",
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Krishna Consciousness Society</h1>
        <p className="text-gray-500">Dedicated to spreading Vedic wisdom through technology.</p>
      </div>

      {/* Spiritual Leadership Section */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800 border-b pb-4 mx-auto max-w-xs">
          Our Inspiration & Leadership
        </h2>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-12">
          
          {/* Srila Prabhupada */}
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-48 h-48 relative mb-6 rounded-full overflow-hidden border-4 border-orange-100 shadow-xl">
              {/* REPLACE '/images/prabhupada.jpg' with your actual image path */}
              <Image 
                src="/logo/Srila-Prabhupada.png"
                alt="Srila Prabhupada" 
                fill 
                className="object-cover" 
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">His Divine Grace A.C. Bhaktivedanta Swami Prabhupada</h3>
            <p className="text-orange-600 font-semibold mt-1">Founder-Acharya: International Society for Krishna Consciousness</p>
          </div>

          {/* HG Gauranga Sundar das */}
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-40 h-40 relative mb-6 rounded-full overflow-hidden border-4 border-blue-50 shadow-lg bg-gray-100">
               {/* Placeholder for HG Gauranga Sundar das */}
               <Image src="/logo/Gurudev.jpg" alt="HG Gauranga Sundar das" fill className="object-cover" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">HG Gauranga Sundar das</h3>
            <p className="text-blue-600 font-semibold mt-1">Founder (KCS)</p>
          </div>
          
        </div>
      </section>

      {/* Developer Team Section */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800 border-b pb-4 mx-auto max-w-xs">
          Development Team
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {developers.map((dev, index) => (
            <TeamMemberCard 
              key={index}
              name={dev}
              role="Developer"
              // Add images to array above and pass here if available
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default DevelopersPage;