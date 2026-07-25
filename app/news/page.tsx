'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Filter,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  Globe
} from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { toast } from 'sonner';

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'CPI' | 'NFP' | 'FOMC' | 'GDP' | 'ECONOMIC' | 'MARKET' | 'POLITICAL';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  symbols: string[];
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  isRead: boolean;
  sentimentScore?: number;
  ticker?: string;
  relevanceScore?: number;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [showRead, setShowRead] = useState(true);

  const categories = [
    { value: 'ALL', label: 'All News', color: 'bg-gray-100 text-black' },
    { value: 'CPI', label: 'CPI', color: 'bg-red-100 text-red-800' },
    { value: 'NFP', label: 'NFP', color: 'bg-blue-100 text-blue-800' },
    { value: 'FOMC', label: 'FOMC', color: 'bg-green-100 text-green-800' },
    { value: 'GDP', label: 'GDP', color: 'bg-purple-100 text-purple-800' },
    { value: 'ECONOMIC', label: 'Economic', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'MARKET', label: 'Market', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'POLITICAL', label: 'Political', color: 'bg-pink-100 text-pink-800' }
  ];

  const impacts = [
    { value: 'ALL', label: 'All Impact', color: 'bg-gray-100 text-black' },
    { value: 'HIGH', label: 'High Impact', color: 'bg-red-100 text-red-800' },
    { value: 'MEDIUM', label: 'Medium Impact', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'LOW', label: 'Low Impact', color: 'bg-green-100 text-green-800' }
  ];

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    filterNews();
  }, [news, searchTerm, selectedCategory, selectedImpact, selectedSentiment, showRead]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      } else {
        toast.error('Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/news?refresh=true');
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
        toast.success('News refreshed successfully');
      } else {
        toast.error('Failed to refresh news');
      }
    } catch (error) {
      console.error('Error refreshing news:', error);
      toast.error('Network error');
    } finally {
      setRefreshing(false);
    }
  };

  const filterNews = () => {
    let filtered = news;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ticker && item.ticker.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by impact
    if (selectedImpact !== 'ALL') {
      filtered = filtered.filter(item => item.impact === selectedImpact);
    }

    // Filter by sentiment
    if (selectedSentiment !== 'ALL') {
      filtered = filtered.filter(item => item.sentiment === selectedSentiment);
    }

    // Filter by read status
    if (!showRead) {
      filtered = filtered.filter(item => !item.isRead);
    }

    setFilteredNews(filtered);
  };

  const markAsRead = async (newsId: string) => {
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId })
      });

      if (response.ok) {
        setNews(prev => prev.map(item =>
          item._id === newsId ? { ...item, isRead: true } : item
        ));
      }
    } catch (error) {
      console.error('Error marking news as read:', error);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'NEGATIVE': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'border-red-500 bg-red-50';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50';
      case 'LOW': return 'border-green-500 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
      case 'NEGATIVE':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
      case 'NEUTRAL':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading news...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-black dark:text-white">Market <span className="text-green-600">News</span></h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={refreshNews} 
              disabled={refreshing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowRead(!showRead)}
              className="border-gray-300 text-black dark:text-white dark:border-gray-600"
            >
              {showRead ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showRead ? 'Hide Read' : 'Show All'}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-black border-gray-300 dark:border-gray-600 text-black dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`${
                    selectedCategory === category.value 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border-gray-300 text-black dark:text-white dark:border-gray-600'
                  }`}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Impact Filters */}
            <div className="flex flex-wrap gap-2">
              {impacts.map((impact) => (
                <Button
                  key={impact.value}
                  variant={selectedImpact === impact.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedImpact(impact.value)}
                  className={`${
                    selectedImpact === impact.value 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'border-gray-300 text-black dark:text-white dark:border-gray-600'
                  }`}
                >
                  {impact.label}
                </Button>
              ))}
            </div>

            {/* Sentiment Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSentiment === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSentiment('ALL')}
                className={`${
                  selectedSentiment === 'ALL' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'border-gray-300 text-black dark:text-white dark:border-gray-600'
                }`}
              >
                All Sentiment
              </Button>
              <Button
                variant={selectedSentiment === 'POSITIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSentiment('POSITIVE')}
                className={`${
                  selectedSentiment === 'POSITIVE' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'border-gray-300 text-black dark:text-white dark:border-gray-600'
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Positive
              </Button>
              <Button
                variant={selectedSentiment === 'NEGATIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSentiment('NEGATIVE')}
                className={`${
                  selectedSentiment === 'NEGATIVE' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'border-gray-300 text-black dark:text-white dark:border-gray-600'
                }`}
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                Negative
              </Button>
              <Button
                variant={selectedSentiment === 'NEUTRAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSentiment('NEUTRAL')}
                className={`${
                  selectedSentiment === 'NEUTRAL' 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'border-gray-300 text-black dark:text-white dark:border-gray-600'
                }`}
              >
                <Minus className="w-3 h-3 mr-1" />
                Neutral
              </Button>
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => (
            <Card key={item._id} className="news-card hover:shadow-lg transition-all duration-200 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="news-title mb-2 text-black dark:text-white">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getImpactColor(item.impact)}`}
                      >
                        {item.impact} Impact
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getSentimentIcon(item.sentiment)}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {item.sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!item.isRead && (
                    <div className="w-2 h-2 bg-green-600 rounded-full ml-2"></div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="news-summary text-gray-700 dark:text-gray-300">
                  {item.summary}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.publishedAt)}</span>
                  </div>
                  <span className="news-source">{item.source}</span>
                </div>

                {item.symbols.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.symbols.map((symbol) => (
                      <Badge key={symbol} variant="secondary" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {symbol}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(item._id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  >
                    {item.isRead ? 'Mark Unread' : 'Mark Read'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(item.url, '_blank')}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Read More
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredNews.length === 0 && !loading && (
          <div className="text-center py-12">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No news found
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 