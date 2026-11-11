import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Flame } from 'lucide-react';
import ShimmerButton from './ShimmerButton';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export default function ToriiSakuraHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sakura Petal Particle Canvas with Authentic Notched Cherry Blossom Leaves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Realistic Sakura palette (soft cherry blossom rose, blush, and ivory)
    const petalColors = ['#FFCCD5', '#FFB7C5', '#FFAAA6', '#FFF0F5', '#F8A5C2', '#FFD1DC'];
    const petals: Petal[] = Array.from({ length: 36 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 7,
      speedX: Math.random() * 1.4 - 0.5,
      speedY: Math.random() * 1.6 + 0.8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2.2,
      opacity: Math.random() * 0.55 + 0.35,
      color: petalColors[Math.floor(Math.random() * petalColors.length)] || '#FFB7C5',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 25) {
          p.y = -25;
          p.x = Math.random() * width;
        }
        if (p.x > width + 25) p.x = -25;
        if (p.x < -25) p.x = width + 25;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Authentic Japanese Sakura Petal Geometry with Natural Cleft Notch
        const w = p.size;
        const h = p.size * 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.5); // Petal base stem
        // Right petal flank
        ctx.bezierCurveTo(w * 0.72, -h * 0.25, w * 0.85, h * 0.28, w * 0.24, h * 0.5);
        // Signature notched cleft at the petal tip (桜の花びらの切れ込み)
        ctx.quadraticCurveTo(0, h * 0.34, -w * 0.24, h * 0.5);
        // Left petal flank
        ctx.bezierCurveTo(-w * 0.85, h * 0.28, -w * 0.72, -h * 0.25, 0, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative min-h-[580px] lg:min-h-[660px] w-full overflow-hidden bg-[#14191D] rounded-3xl border border-[#252E37] shadow-2xl flex items-center mb-12">
      {/* Background Image: Traditional Japanese Shrine & Torii Landscape */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/art/hero-torii-scenery.jpg"
          alt="Traditional Japanese Torii Gate"
          className="w-full h-full object-cover object-right lg:object-center opacity-40 filter saturate-[1.3] contrast-[1.15]"
        />
        {/* Editorial Gradients: Traditional Sumi Ink fade left to right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#14191D] via-[#14191D]/90 to-[#14191D]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-[#14191D]/60" />
      </div>

      {/* 60fps Floating Sakura Leaves Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none w-full h-full"
      />

      {/* Main Hero Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column (7 cols): Typography, Pitch & Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Primary Display Title */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              <span className="text-[#FAF3E0] block drop-shadow-sm">DISCOVER</span>
              <span className="text-emerald-400 font-black block drop-shadow-md py-0.5">
                ANIME THAT
              </span>
              <span className="text-brand-yellow block drop-shadow-sm">
                MOVES YOU.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#D0D7DE] max-w-xl font-medium leading-relaxed pt-2">
              Powered by deep sensory matching, franchise-aware continuity, and real-time taste evolution. No generic lists—just anime crafted for your exact taste.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link to="/questionnaire">
              <ShimmerButton
                variant="primary"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-600/30 font-bold"
              >
                <Flame className="w-5 h-5 mr-2 text-brand-yellow" />
                Find My Anime Match
              </ShimmerButton>
            </Link>

            <Link to="/discover">
              <ShimmerButton variant="outline" size="lg">
                <Compass className="w-5 h-5 mr-2 text-brand-sky" />
                Explore Universe
              </ShimmerButton>
            </Link>
          </div>

          {/* Quick Thematic Tags */}
          <div className="pt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
            <span className="text-[#FAF3E0] flex items-center gap-1 mr-1">
              <Flame className="w-3.5 h-3.5 text-brand-orange" />
              Hot Themes:
            </span>
            {['Shounen Rush', 'Feudal Samurai', 'Psychological Warfare', 'Kyoto Slice of Life'].map(
              (tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag.split(' ')[0] || '')}`}
                  className="px-2.5 py-1 rounded-lg bg-[#1C2329]/90 hover:bg-[#252E37] text-[#D0D7DE] hover:text-brand-yellow border border-[#2E3842] transition-colors"
                >
                  #{tag}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Flagship Artwork Preview Card with SBR & Monster Visuals */}
        <div className="lg:col-span-5 relative hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-md h-[460px]">
            {/* Background Monster Poster */}
            <div className="absolute top-2 right-2 w-56 h-80 rounded-2xl overflow-hidden border-2 border-brand-emerald/40 shadow-2xl shadow-brand-emerald/20 transform rotate-3 hover:rotate-0 transition-transform duration-500 z-10 group">
              <img
                src="/posters/monster.jpg"
                alt="Monster"
                className="w-full h-full object-cover filter contrast-[1.05] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-transparent opacity-85" />
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-emerald">Psychological Noir</span>
                <p className="text-sm font-black text-white">Monster</p>
              </div>
            </div>

            {/* Foreground Steel Ball Run Poster */}
            <div className="absolute bottom-4 left-3 w-64 h-[370px] rounded-2xl overflow-hidden border-2 border-brand-pink/60 shadow-2xl shadow-brand-pink/35 transform -rotate-2 hover:rotate-0 transition-transform duration-500 z-20 group">
              <img
                src="/posters/sbr.webp"
                alt="JoJo's Bizarre Adventure: Steel Ball Run"
                className="w-full h-full object-cover filter contrast-[1.05] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink">Stand Mastery</span>
                <p className="text-base font-black text-white">Steel Ball Run</p>
              </div>
            </div>

            {/* Decorative Floating Kanji Badge */}
            <div className="absolute -top-3 -left-3 z-30 px-3 py-2 rounded-xl bg-brand-cream text-brand-ink font-japanese font-black text-xs shadow-2xl border border-[#2E3842] rotate-6">
              新時代へ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
