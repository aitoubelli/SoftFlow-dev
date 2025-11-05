"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import heroBackground from "@/assets/hero-background.png";

const Landing = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-[#4A00E0] to-[#8E2DE2]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBackground.src})`,
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#4A00E0]/20 to-[#8E2DE2]/60"></div>
      <section className="relative overflow-hidden min-h-screen flex items-center z-10">
        <div className="relative container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
              Accédez à votre espace de travail
            </h1>
            <p className="text-xl text-white mb-8">
              Accès sécurisé et interne pour votre équipe de développement. Gérez les projets, suivez les problèmes et collaborez efficacement.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => router.push('/auth')}
                className="h-11 px-8 rounded-md text-sm font-medium group inline-flex items-center justify-center whitespace-nowrap transition-colors bg-gradient-to-r from-[#4A00E0] to-[#8E2DE2] text-white hover:from-[#5A10F0] hover:to-[#9E3DE2]"
              >
                Se connecter maintenant
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
