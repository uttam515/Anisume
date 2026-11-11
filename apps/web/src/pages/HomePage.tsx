import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Anime, RecommendedAnimeItem } from '@anisume/shared';
import { api, type GenreItem } from '../api/client.js';
import { recommendationClient } from '../api/recommendationClient.js';
import { useAuth } from '../context/AuthContext.js';
import ToriiSakuraHero from '../components/ToriiSakuraHero.js';
import Marquee from '../components/Marquee.js';
import AnimeGrid from '../components/AnimeGrid.js';
import RecommendationCard from '../components/RecommendationCard.js';
import SectionHeader from '../components/SectionHeader.js';
import ShimmerButton from '../components/ShimmerButton.js';
import { GridSkeleton } from '../components/LoadingSkeleton.js';
import { ErrorState } from '../components/EmptyState.js';
import { Flame, Star, Compass, Zap, BookOpen } from 'lucide-react';

const STUDIOS = [
  { name: 'MAPPA', kanji: 'マッパ', highlight: 'Jujutsu Kaisen • Chainsaw Man' },
  { name: 'ufotable', kanji: 'ユーフォーテーブル', highlight: 'Demon Slayer • Fate/stay night' },
  { name: 'Studio Ghibli', kanji: 'スタジオジブリ', highlight: 'Spirited Away • Mononoke' },
  { name: 'Bones', kanji: 'ボンズ', highlight: 'Mob Psycho • My Hero' },
  { name: 'Madhouse', kanji: 'マッドハウス', highlight: 'Death Note • Frieren • Hunter x Hunter' },
  { name: 'Wit Studio', kanji: 'ウィットスタジオ', highlight: 'Attack on Titan • Spy x Family' },
  { name: 'Kyoto Animation', kanji: '京都アニメーション', highlight: 'Violet Evergarden • A Silent Voice' },
];

// The Flagship 7 Anime Legends with Latest Verified Posters
const FLAGSHIP_LEGENDS = [
  {
    title: 'One Piece',
    subtitle: 'Egghead Island Arc',
    kanji: '新章',
    tag: 'Latest Arc',
    poster: '/posters/onepiece.jpg',
    score: '8.9',
    type: 'TV Series',
    year: '2024',
    malId: 21,
    accentBorder: 'border-brand-red/50 hover:border-brand-red',
    badgeClass: 'bg-brand-red/20 text-brand-red border-brand-red/40',
    desc: 'Gear 5 Luffy and the Straw Hats arrive at the Island of the Future, uncovering world secrets.',
  },
  {
    title: 'Bleach',
    subtitle: 'Thousand-Year Blood War',
    kanji: '千年',
    tag: 'Final Arc',
    poster: '/posters/bleach.webp',
    score: '9.0',
    type: 'TV Series',
    year: '2023',
    malId: 41467,
    accentBorder: 'border-brand-orange/50 hover:border-brand-orange',
    badgeClass: 'bg-brand-orange/20 text-brand-orange border-brand-orange/40',
    desc: 'The ancient spiritual conflict erupts with breathtaking animation and Gotei 13 Bankai releases.',
  },
  {
    title: 'Naruto',
    subtitle: 'Shippuden Legends',
    kanji: '忍道',
    tag: 'Classic Shounen',
    poster: '/assets/art/naruto-shippuden.jpg',
    score: '8.3',
    type: 'TV Series',
    year: '2007',
    malId: 1735,
    accentBorder: 'border-brand-yellow/50 hover:border-brand-yellow',
    badgeClass: 'bg-brand-yellow/20 text-brand-yellow border-brand-yellow/40',
    desc: 'The enduring path of Naruto Uzumaki, the Will of Fire, and the legendary ninja world showdown.',
  },
  {
    title: 'Attack on Titan',
    subtitle: 'The Final Season',
    kanji: '巨人',
    tag: 'Modern Epic',
    poster: '/assets/art/aot-final.jpg',
    score: '8.8',
    type: 'TV Series',
    year: '2023',
    malId: 40028,
    accentBorder: 'border-brand-sky/50 hover:border-brand-sky',
    badgeClass: 'bg-brand-sky/20 text-brand-sky border-brand-sky/40',
    desc: 'The monumental climax of Eren Yeager, the Survey Corps, and the apocalyptic Rumbling.',
  },
  {
    title: "JoJo's Bizarre Adventure",
    subtitle: 'Steel Ball Run & Beyond',
    kanji: '奇妙',
    tag: 'Stand Mastery',
    poster: '/posters/sbr.webp',
    score: '8.8',
    type: 'TV Series',
    year: '2024',
    malId: 14719,
    accentBorder: 'border-brand-pink/50 hover:border-brand-pink',
    badgeClass: 'bg-brand-pink/20 text-brand-pink border-brand-pink/40',
    desc: 'Generational bloodlines, legendary poses, flamboyant style, and tactical Stand combat.',
  },
  {
    title: 'Monster',
    subtitle: 'Naoki Urasawa',
    kanji: '怪物',
    tag: 'Psychological Noir',
    poster: '/posters/monster.jpg',
    score: '8.9',
    type: 'TV Series',
    year: '2004',
    malId: 19,
    accentBorder: 'border-brand-emerald/50 hover:border-brand-emerald',
    badgeClass: 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40',
    desc: 'Dr. Kenzo Tenma tracks the charismatic psychopath Johan Liebert across post-Cold War Europe.',
  },
  {
    title: 'Death Note',
    subtitle: 'Light vs L Mind Game',
    kanji: '死神',
    tag: 'Cat & Mouse',
    poster: '/assets/art/deathnote-hd.jpg',
    score: '8.6',
    type: 'TV Series',
    year: '2006',
    malId: 1535,
    accentBorder: 'border-brand-red/50 hover:border-brand-red',
    badgeClass: 'bg-brand-red/20 text-brand-red border-brand-red/40',
    desc: 'The definitive intellectual showdown between a notebook-wielding genius and the master detective.',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedAnimeItem[]>([]);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendRes, topRes, genRes] = await Promise.all([
        api.getTrending().catch(() => []),
        api.getTopRated().catch(() => []),
        api.getGenres().catch(() => []),
      ]);

      setTrending(trendRes);
      setTopRated(topRes);
      setGenres(genRes);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to load anime data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      recommendationClient
        .getRecommendations({ limit: 6 })
        .then((res) => setRecommendations(res.data))
        .catch(() => setRecommendations([]));
    } else {
      setRecommendations([]);
    }
  }, [user]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-16">
      {/* 1. Cinematic Asymmetrical Torii Gate Hero with Sakura Canvas */}
      <ToriiSakuraHero />

      {/* 2. Studio Marquee Ticker */}
      <div className="py-2 border-y border-dark-800 bg-dark-900/40 rounded-2xl">
        <Marquee speed={28} pauseOnHover={true}>
          {STUDIOS.map((studio) => (
            <Link
              key={studio.name}
              to={`/search?q=${encodeURIComponent(studio.name)}`}
              className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-dark-850 transition-all group"
            >
              <span className="w-2 h-2 rounded-full bg-brand-red group-hover:scale-125 transition-transform" />
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-white group-hover:text-brand-red transition-colors">
                    {studio.name}
                  </span>
                  <span className="font-japanese text-[10px] text-slate-500 group-hover:text-slate-300">
                    {studio.kanji}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {studio.highlight}
                </span>
              </div>
            </Link>
          ))}
        </Marquee>
      </div>

      {/* 3. Personalized Recommendations (Logged In) */}
      {user && recommendations.length > 0 && (
        <section className="bg-gradient-to-r from-brand-red/10 via-[#14191D] to-[#14191D] border border-brand-red/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <SectionHeader
            title="Personalized Recommendations"
            subtitle="Real-time taste matches. React with Heart, Dislike, or Watched to evolve your signals."
            kanji="あなたへ"
            accentColor="red"
            icon={Flame}
            viewAllLink="/recommendations"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.slice(0, 6).map((rec) => (
              <RecommendationCard
                key={rec.anime.mal_id}
                item={rec}
                getOnScreenMalIds={() => recommendations.map((r) => r.anime.mal_id)}
                onReviewed={(malId, _action, replacement) =>
                  setRecommendations((prev) =>
                    replacement
                      ? prev.map((r) => (r.anime.mal_id === malId ? replacement : r))
                      : prev.filter((r) => r.anime.mal_id !== malId)
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Trending in Tokyo (Asymmetrical Editorial Row) */}
      <section className="space-y-6">
        <SectionHeader
          title="Trending in Tokyo"
          subtitle="The most talked-about series airing and streaming right now"
          kanji="今週の人気"
          accentColor="pink"
          icon={Flame}
          viewAllLink="/discover?sort=popularity"
        />
        {loading ? <GridSkeleton count={6} /> : <AnimeGrid animeList={trending.slice(0, 12)} />}
      </section>

      {/* 5. The Flagship 7 Anime Legends (Editorial Showcase with Latest Posters) */}
      <section className="space-y-6">
        <SectionHeader
          title="Flagship S-Tier Masterpieces"
          subtitle="The defining sagas of anime culture, presented in their definitive releases"
          kanji="傑作七選"
          accentColor="orange"
          icon={Compass}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {FLAGSHIP_LEGENDS.map((anime) => (
            <Link
              key={anime.title}
              to={`/anime/${anime.malId}`}
              className={`group flex flex-col justify-between bg-[#14191D] rounded-2xl overflow-hidden border ${anime.accentBorder} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none`}
            >
              {/* Poster Container with Aspect 2/3 */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0D100F]">
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14191D] via-transparent to-transparent opacity-75" />

                {/* Top Overlay Badges */}
                <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                  {/* Japanese Kanji Seal */}
                  <span className="w-6 h-6 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-black text-brand-red flex items-center justify-center font-japanese border border-brand-red/30 shadow-md">
                    {anime.kanji}
                  </span>

                  {/* MAL Score */}
                  <div className="px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-brand-yellow/30 text-[11px] font-black text-brand-yellow flex items-center space-x-1 shadow-md">
                    <Star className="w-3 h-3 fill-brand-yellow text-brand-yellow" />
                    <span>{anime.score}</span>
                  </div>
                </div>

                {/* Bottom Overlay Tag */}
                <div className="absolute bottom-2 left-2 right-2">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${anime.badgeClass}`}>
                    {anime.tag}
                  </span>
                </div>
              </div>

              {/* Card Meta Body */}
              <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#FAF3E0] group-hover:text-brand-red transition-colors line-clamp-1 leading-snug">
                    {anime.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                    {anime.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#252E37] flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">{anime.type}</span>
                  <span>{anime.year}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Genre Palette (Light Editorial Contrast Bar) */}
      {genres.length > 0 && (
        <section className="bg-brand-cream text-brand-ink rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-ink text-brand-cream text-[11px] font-black uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5 text-brand-yellow" />
                <span>Editorial Taxonomy</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-ink">
                Browse by Category & Mood
              </h3>
              <p className="text-xs sm:text-sm text-dark-700 mt-1 font-medium">
                Deep categorisation across 50+ genres, demographic tags, and narrative archetypes.
              </p>
            </div>
            <Link
              to="/discover"
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-brand-red text-white hover:bg-red-700 shadow-md shadow-brand-red/20 transition shrink-0"
            >
              Open Complete Filter Matrix →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {genres.slice(0, 18).map((genre) => (
              <Link
                key={genre.name}
                to={`/discover?genres=${encodeURIComponent(genre.name)}`}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-red hover:shadow-lg transition-all duration-200"
              >
                <span className="text-xs font-extrabold text-dark-900 group-hover:text-brand-red transition-colors truncate">
                  {genre.name}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-brand-red group-hover:text-white transition-colors">
                  {genre.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Top Rated Masterpieces (Sky Blue Contrast Block) */}
      <section className="space-y-6">
        <SectionHeader
          title="All-Time Masterpieces"
          subtitle="Highest scored anime in history, verified by community ratings"
          kanji="名作の殿堂"
          accentColor="yellow"
          icon={Star}
          viewAllLink="/discover?sort=highest_rated"
        />
        {loading ? <GridSkeleton count={6} /> : <AnimeGrid animeList={topRated.slice(0, 12)} />}
      </section>

      {/* 8. Full-Bleed Discovery CTA Banner with Naruto key art */}
      <section className="relative rounded-3xl overflow-hidden bg-brand-ink border border-dark-800 shadow-2xl p-8 sm:p-14">
        {/* Naruto backdrop image with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/art/naruto.jpg"
            alt="Naruto Shippuden"
            className="w-full h-full object-cover object-right opacity-30 filter saturate-150 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow text-xs font-black uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Ready for your next obsession?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Stop scrolling endlessly. <br />
            Let our algorithm do the work.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Take our 60-second interactive questionnaire to calibrate your personal taste signature, exclude series you've watched, and unlock your ultimate watchlist.
          </p>
          <div className="pt-2">
            <Link to="/questionnaire">
              <ShimmerButton variant="primary" size="lg">
                <Flame className="w-5 h-5 mr-2 text-brand-yellow" />
                Start 60-Second Taste Quiz
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
