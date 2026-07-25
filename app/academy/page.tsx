"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  BookOpen,
  PlayCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Shield,
  Smartphone,
  Globe,
  Target,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Video {
  _id: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  category: string;
  duration?: string;
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "Forex Basics",
  "Technical Analysis",
  "Risk Management",
  "Trading Psychology",
  "Advanced Strategies",
  "Platform Tutorials",
];

export default function AcademyPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data?.videos) {
        setVideos(data.videos);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter((video) => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-green-900 via-black to-green-900">
        <div className="absolute inset-0 bg-[url('/trading2.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" variant="outline">
            <BookOpen className="w-3 h-3 mr-1" />
            Ready Pips Academy
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Learn <span className="text-green-400">Trading</span>
          </h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Free educational videos to help you master forex and crypto trading
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 px-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-black border-gray-200 dark:border-gray-800"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading videos...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black dark:text-white mb-2">No videos yet</h3>
              <p className="text-gray-500">Check back soon for new educational content</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card
                  key={video._id}
                  className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-t-lg overflow-hidden">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-16 h-16 text-white" />
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800 text-xs">
                        {video.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-black dark:text-white text-base group-hover:text-green-600 transition-colors">
                      {video.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {video.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="max-w-4xl w-full bg-white dark:bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <video
                controls
                autoPlay
                className="w-full h-full"
                src={selectedVideo.url}
                poster={selectedVideo.thumbnail}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-6">
              <Badge className="mb-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800">
                {selectedVideo.category}
              </Badge>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                {selectedVideo.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
              What You'll <span className="text-green-600 dark:text-green-400">Learn</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">Technical Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">Learn chart patterns, indicators, and price action</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">Risk Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Master position sizing, stop losses, and capital preservation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">Trading Psychology</h3>
              <p className="text-gray-600 dark:text-gray-400">Develop discipline, patience, and emotional control</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}