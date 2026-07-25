'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Filter,
  Flag,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { toast } from 'sonner';

interface EconomicEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  country: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  previous: string;
  forecast: string;
  actual?: string;
  category: 'CPI' | 'NFP' | 'FOMC' | 'GDP' | 'INTEREST_RATE' | 'UNEMPLOYMENT' | 'RETAIL_SALES' | 'OTHER';
  symbols: string[];
  isCompleted: boolean;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [showCompleted, setShowCompleted] = useState(false);

  const categories = [
    { value: 'ALL', label: 'All Events', color: 'bg-gray-100' },
    { value: 'CPI', label: 'CPI', color: 'bg-red-100' },
    { value: 'NFP', label: 'NFP', color: 'bg-blue-100' },
    { value: 'FOMC', label: 'FOMC', color: 'bg-green-100' },
    { value: 'GDP', label: 'GDP', color: 'bg-purple-100' },
    { value: 'INTEREST_RATE', label: 'Interest Rate', color: 'bg-yellow-100' },
    { value: 'UNEMPLOYMENT', label: 'Unemployment', color: 'bg-indigo-100' },
    { value: 'RETAIL_SALES', label: 'Retail Sales', color: 'bg-pink-100' },
    { value: 'OTHER', label: 'Other', color: 'bg-gray-100' }
  ];

  const impacts = [
    { value: 'ALL', label: 'All Impact', color: 'bg-gray-100' },
    { value: 'HIGH', label: 'High Impact', color: 'bg-red-100' },
    { value: 'MEDIUM', label: 'Medium Impact', color: 'bg-yellow-100' },
    { value: 'LOW', label: 'Low Impact', color: 'bg-green-100' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedCategory, selectedImpact, showCompleted]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        toast.error('Failed to fetch economic events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/calendar?refresh=true');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        toast.success('Economic calendar refreshed successfully');
      } else {
        toast.error('Failed to refresh economic calendar');
      }
    } catch (error) {
      console.error('Error refreshing events:', error);
      toast.error('Network error');
    } finally {
      setRefreshing(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by impact
    if (selectedImpact !== 'ALL') {
      filtered = filtered.filter(event => event.impact === selectedImpact);
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(event => !event.isCompleted);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredEvents(filtered);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'border-red-500 bg-red-50';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50';
      case 'LOW': return 'border-green-500 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CPI': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'NFP': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'FOMC': return <AlertTriangle className="w-4 h-4 text-green-500" />;
      case 'GDP': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return today.toDateString() === eventDate.toDateString();
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return eventDate > today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading economic calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Economic Calendar</h1>
          </div>
          <Button onClick={refreshEvents} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category and Impact Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {impacts.map((impact) => (
                <Button
                  key={impact.value}
                  variant={selectedImpact === impact.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedImpact(impact.value)}
                >
                  {impact.label}
                </Button>
              ))}
            </div>

            {/* Show/Hide Completed */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? <CheckCircle className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </Button>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card 
                key={event._id} 
                className={`event-card ${getImpactColor(event.impact)} ${
                  isToday(event.date) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getCategoryIcon(event.category)}
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {isToday(event.date) && (
                          <Badge variant="destructive">TODAY</Badge>
                        )}
                        {isUpcoming(event.date) && (
                          <Badge variant="default">UPCOMING</Badge>
                        )}
                        {event.isCompleted && (
                          <Badge variant="secondary">COMPLETED</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">{event.category}</Badge>
                        <Badge variant={event.impact === 'HIGH' ? 'destructive' : event.impact === 'MEDIUM' ? 'default' : 'secondary'}>
                          {event.impact} Impact
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Flag className="w-3 h-3" />
                          <span className="text-sm text-muted-foreground">{event.country}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Previous</div>
                      <div className="font-semibold">{event.previous}</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Forecast</div>
                      <div className="font-semibold">{event.forecast}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Actual</div>
                      <div className="font-semibold">{event.actual || 'Pending'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{event.currency}</div>
                    </div>
                  </div>

                  {event.symbols.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Affected Symbols:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.symbols.slice(0, 5).map((symbol) => (
                          <Badge key={symbol} variant="outline" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                        {event.symbols.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{event.symbols.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Set Reminder
                    </Button>
                    <Button variant="outline" size="sm">
                      View Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Economic Events Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or refresh the calendar.
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {filteredEvents.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{filteredEvents.length}</div>
                    <div className="text-sm text-muted-foreground">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredEvents.filter(e => e.impact === 'HIGH').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredEvents.filter(e => isToday(e.date)).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredEvents.filter(e => e.isCompleted).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 