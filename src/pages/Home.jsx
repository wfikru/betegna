import { useState, useEffect } from "react";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search, ArrowRight, X
} from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { useAuth } from "@/lib/AuthContext";

const HOME_GUIDE_DISMISSED_KEY = "betegna.homeGuideDismissed.v1";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(HOME_GUIDE_DISMISSED_KEY) === "true";
      setShowFirstTimeGuide(!dismissed);
    } catch {
      setShowFirstTimeGuide(true);
    }
  }, []);

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
      navigate(createPageUrl("BrowseTasks"));
      return;
    }

    const params = new URLSearchParams();
    params.set("search", trimmedQuery);

    const inferredCategory = inferCategoryFromQuery(trimmedQuery);
    if (inferredCategory) {
      params.set("category", inferredCategory);
    }

    navigate(`${createPageUrl("BrowseTasks")}?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToBrowseWithQuery(searchQuery);
  };

  const handleQuickSearch = (term) => {
    setSearchQuery(term);
    goToBrowseWithQuery(term);
  };

  const dismissFirstTimeGuide = () => {
    setShowFirstTimeGuide(false);
    try {
      localStorage.setItem(HOME_GUIDE_DISMISSED_KEY, "true");
    } catch {
      // ignore storage errors (private mode / restricted browser settings)
    }
  };

  const howItWorks = [
    {
      step: "1",
      title: "Post Your Task",
      description: "Describe what you need done and set your budget",
    },
    {
      step: "2",
      title: "Get Offers",
      description: "Skilled taskers send you offers with their price and availability",
    },
    {
      step: "3",
      title: "Choose & Chat",
      description: "Review profiles, chat with taskers, and select the best fit",
    },
    {
      step: "4",
      title: "Get It Done",
      description: "Tasker completes your task. You review and pay securely",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-green-50 mb-8 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder={t('home.hero.searchPlaceholder')}
                  className="pl-12 h-14 text-base bg-white border-0 shadow-lg text-gray-900 placeholder:text-gray-500 caret-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 h-14 px-8 font-semibold shadow-lg"
              >
                {t('home.hero.findTaskers')}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* First-time User Guide (shown once, can be dismissed) */}
      {showFirstTimeGuide && (
        <section className="py-8 bg-emerald-50 border-y border-emerald-100">
          <div className="max-w-6xl mx-auto px-4">
            <Card className="border-emerald-200 bg-white shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 mb-1">{t('home.firstTimeGuide.badge')}</p>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.firstTimeGuide.title')}</h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      {t('home.firstTimeGuide.description')}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss guide"
                    onClick={dismissFirstTimeGuide}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-green-700 hover:bg-green-800"
                    onClick={() => navigate(createPageUrl("BrowseTasks"))}
                  >
                    {t('home.firstTimeGuide.exploreTasks')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl(user ? "PostTask" : "Login"))}
                  >
                    {t('home.firstTimeGuide.postFirstTask')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

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
              return (
                <Link
                  key={category.id}
                  to={`${createPageUrl("BrowseTasks")}?category=${category.id}`}
                  className="group"
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200 h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <Icon className="w-8 h-8 text-green-700" />
                      </div>
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

      {/* First-time only onboarding sections */}
      {showFirstTimeGuide && (
        <>
          {/* How It Works */}
          <section className="py-12 md:py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  How Betegna Works
                </h2>
                <p className="text-gray-600 text-lg">
                  Getting help is simple and straightforward
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {howItWorks.map((item, index) => (
                  <div key={index} className="relative">
                    <Card className="h-full border-2 hover:border-green-200 transition-all">
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-700 text-white flex items-center justify-center text-2xl font-bold">
                          {item.step}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                    {index < howItWorks.length - 1 && (
                      <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-green-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
