"use client";

import { Metadata } from "next";
import Image from "next/image";

import { useTranslation } from 'react-i18next';

export const metadata: Metadata = {
  title: "Our Team | Krishna Connect",
  description: "Meet the inspiration behind Krishna Connect.",
};

const DevelopersPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Krishna Consciousness Society
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('legal.dedicatedToSpreadingVedicWisdomThrough')}</p>
      </div>

      {/* Spiritual Leadership Section */}
      <section className="mb-20">
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px bg-border flex-1 max-w-[100px]" />
          <h2 className="text-2xl font-bold text-center text-foreground">{t('legal.ourInspirationLeadership')}</h2>
          <div className="h-px bg-border flex-1 max-w-[100px]" />
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-12">

          {/* Srila Prabhupada */}
          <div className="flex flex-col items-center text-center max-w-sm group">
            <div className="w-48 h-48 relative mb-6 rounded-full overflow-hidden border-4 border-primary/10 shadow-xl group-hover:scale-105 transition-transform duration-500">
              <Image
                src="/logo/Srila-Prabhupada.png"
                alt={t('legal.srilaPrabhupada')}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{t('legal.hisDivineGraceAcBhaktivedantaSwami')}</h3>
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

      <div className="mt-20 text-center text-sm text-muted-foreground border-t border-border pt-8">
        <p>&copy; {new Date().getFullYear()} Krishna Connect. All rights reserved.</p>
      </div>
    </div>
  );
};

export default DevelopersPage;