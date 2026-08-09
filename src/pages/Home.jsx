import { useState } from "react";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Briefcase, MessageCircle, CheckCircle } from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { useAuth } from "@/lib/AuthContext";

const HERO_IMAGE = "https://images.unsplash.com/photo-1505238680356-667803448bb6?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=2a3a1a9f3a5b2c4e6d7f8a9b0c1d2e3f";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const quickSearches = [
    "House cleaning",
    "Furniture repair",
    "Delivery",
    "Market shopping",
    "Event setup",
    "Farming help",
  ];

  const categoryKeywordMap = {
    cleaning: ["clean", "cleaning", "maid", "home cleaning", "deep clean"],
    repair: ["repair", "fix", "plumbing", "electric", "carpentry", "maintenance"],
    delivery: ["delivery", "deliver", "courier", "pickup", "drop off", "transport"],
    market: ["market", "shopping", "buy", "grocery", "supplies"],
    event: ["event", "setup", "decorate", "dj", "photo", "videography"],
    farming: ["farm", "farming", "harvest", "planting", "irrigation"],
    errand: ["errand", "assistant", "personal help", "queue", "paperwork"],
  };

  const inferCategoryFromQuery = (query) => {
    const q = query.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywordMap)) {
      if (keywords.some((k) => q.includes(k))) {
        return category;
      }
    }
    return null;
  };

  const goToBrowseWithQuery = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      navigate(createPageUrl("BrowseTaskers"));
      return;
    }

    const params = new URLSearchParams();
    params.set("search", trimmedQuery);

    const inferredCategory = inferCategoryFromQuery(trimmedQuery);
    if (inferredCategory) {
      params.set("category", inferredCategory);
    }

    navigate(`${createPageUrl("BrowseTaskers")}?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToBrowseWithQuery(searchQuery);
  };

  const handleQuickSearch = (term) => {
    setSearchQuery(term);
    goToBrowseWithQuery(term);
  };

  const howItWorks = [
    { step: "1", icon: Search, title: "Browse Taskers", description: "Find skilled professionals in your city by service type" },
    { step: "2", icon: Briefcase, title: "Book Directly", description: "Pick a Tasker, fill in the details, and send your request" },
    { step: "3", icon: MessageCircle, title: "Confirm & Chat", description: "Tasker reviews and accepts, then you chat to coordinate" },
    { step: "4", icon: CheckCircle, title: "Job Done", description: "Tasker shows up, completes the work, you review and close" },
  ];

  function HowItWorks() {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">How Betegna Works</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {howItWorks.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold mb-2 shadow-sm">
                  {item.step}
                </div>
                <Icon className="w-4 h-4 text-green-600 mb-1.5" />
                <p className="text-sm font-bold text-gray-900 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                {i < howItWorks.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-4 -right-2.5 w-4 h-4 text-green-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with image */}
      <section className="relative text-white">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          className="h-[420px] bg-center bg-cover"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white drop-shadow-lg">
                Find trusted local professionals for any job
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed drop-shadow">
                Compare profiles, read reviews, and hire the best person for the job — fast.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-200" />
                  <Input
                    placeholder="What service do you need? (e.g. House cleaning)"
                    className="pl-12 h-14 text-base bg-white border-0 shadow-lg text-gray-900 placeholder:text-gray-500 caret-gray-900"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-green-700 text-white hover:bg-green-800 h-14 px-8 font-semibold shadow-lg"
                >
                  Find Taskers
                </Button>
              </form>

              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {quickSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="px-4 py-1.5 bg-white/90 hover:bg-white text-gray-900 text-sm font-medium rounded-full border border-white/40 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* Popular Categories */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {t('home.categories.title')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('home.categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {taskCategories.slice(0, 8).map((category) => {
              const Icon = category.icon;
              const img = `https://source.unsplash.com/featured/?${encodeURIComponent(category.nameEn)},service`;
              const categoryImages = {
                delivery: new URL('../assets/categories/delivery.svg', import.meta.url).href,
                event: new URL('../assets/categories/event.svg', import.meta.url).href,
                market: new URL('../assets/categories/market.svg', import.meta.url).href,
                repair: new URL('../assets/categories/repair.svg', import.meta.url).href,
                errand: new URL('../assets/categories/errand.svg', import.meta.url).href,
                cleaning: new URL('../assets/categories/cleaning.svg', import.meta.url).href,
                farming: new URL('../assets/categories/farming.svg', import.meta.url).href,
                other: new URL('../assets/categories/other.svg', import.meta.url).href,
              };
              const localImg = categoryImages[category.id];
              const imgSrc = localImg || img;
              return (
                <Link
                  key={category.id}
                  to={`${createPageUrl("BrowseTaskers")}?service=${category.id}`}
                  className="group"
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden h-full">
                      <div className="h-36 bg-cover bg-center overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={category.nameEn}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><rect fill='%23f3f4f6' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23888' font-size='24'>Image unavailable</text></svg>";
                          }}
                        />
                      </div>
                      <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                        {category.nameEn}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <HowItWorks />
        </div>
      </section>
    </div>
  );
}
