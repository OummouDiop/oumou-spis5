import { Leaf, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="relative w-full min-h-screen font-sans overflow-hidden bg-sky-50">
      
      {/* --- CSS ANIMATIONS --- */}
      <style>{`
        /* 1. Déplacement global du drone (Gauche <-> Droite) */
        @keyframes fly-patrol {
          0% { transform: translateX(-20%) translateY(0px) rotate(-2deg); }
          50% { transform: translateX(20%) translateY(-25px) rotate(2deg); }
          100% { transform: translateX(-20%) translateY(0px) rotate(-2deg); }
        }

        /* 2. Rotation rapide des hélices (Flou de mouvement) */
        @keyframes prop-spin {
          0% { transform: rotate(0deg) scaleX(1); }
          50% { transform: rotate(180deg) scaleX(0.8); } /* Scale crée un effet 3D léger */
          100% { transform: rotate(360deg) scaleX(1); }
        }
      `}</style>

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        {/* <img 
          src="https://images.unsplash.com/photo-1625246333195-551e51245128?q=80&w=2664&auto=format&fit=crop" 
          alt="Agriculture Field" 
          className="w-full h-full object-cover object-bottom"
        /> */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/90 via-sky-100/50 to-transparent/20"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer">
          <Leaf className="w-8 h-8 text-green-600 fill-green-600 transform -rotate-45" />
          <span className="text-2xl font-bold tracking-wide text-slate-800">AGRITECH</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden md:block bg-white text-green-700 px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all">
            Sign In
          </button>
          <button className="md:hidden text-slate-800">
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 flex flex-col items-center pt-10 md:pt-16 px-4 text-center">
        
        <h1 className="text-5xl md:text-7xl font-serif text-slate-800 leading-[1.1] mb-6 drop-shadow-sm">
          Irrigation Automatique <br />
          avec la technologie intelligente
        </h1>

        <p className="text-slate-700 max-w-2xl mx-auto text-lg mb-10 leading-relaxed font-medium">
        aide les agriculteurs à améliorer leur productivité grâce à des outils intelligents, des techniques modernes et une Irrigation optimal.        </p>

        <button 
          onClick={handleGoToDashboard}
          className="bg-green-600 hover:bg-green-700 text-white text-lg px-10 py-3 rounded-full font-semibold shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transition-all transform hover:-translate-y-1 cursor-pointer"
        >
          Aller au dashboard
        </button>
      </main>


    </div>
  );
}