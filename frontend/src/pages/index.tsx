import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import heroBackground from "@/assets/hero-background.png";

const Landing = () => {
  const router = useRouter();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#4A00E0] to-[#8E2DE2] flex items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(rgba(74, 0, 224, 0.8), rgba(142, 45, 226, 0.8)), url(${heroBackground.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="relative container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
              Accédez à votre espace de travail
            </h1>
            <p className="text-xl text-white mb-8">
              Accès sécurisé et interne pour votre équipe de développement. Gérez les projets, suivez les problèmes et collaborez efficacement.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                variant="hero"
                onClick={() => router.push('/auth')}
                className="group"
              >
                Se connecter maintenant
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
