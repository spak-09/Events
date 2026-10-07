import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Users, ArrowRight, Filter } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { SkeletonCard } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/shared/EmptyState';
import apiClient from '../../../lib/axios';
import { formatDate, getResourceId } from '../../../lib/utils';

export function EventDiscoveryPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const categories = [
    'all',
    'Artificial Intelligence',
    'Engineering',
    'DevOps & Cloud',
    'Cybersecurity',
    'Architecture',
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/events');
        const items = res.data?.data?.items || res.data?.data || [];
        setEvents(items);
      } catch (err) {
        // quiet fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((evt) => {
    const matchesSearch =
      evt.title?.toLowerCase().includes(search.toLowerCase()) ||
      evt.description?.toLowerCase().includes(search.toLowerCase()) ||
      evt.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || evt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Discover Conferences
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Explore upcoming industry summits, keynotes, and technical tracks.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            icon={Search}
            placeholder="Search summits, topics, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events match your criteria"
          description="Try adjusting your keywords or category filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((evt) => {
            const eventId = getResourceId(evt);

            return (
            <Card
              key={eventId || evt.title}
              className="overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between group shadow-card"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={evt.status === 'live' ? 'success' : 'accent'}>
                    {evt.status === 'live' ? '● Live' : evt.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDate(evt.startDate)}
                  </span>
                </div>

                <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {evt.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                  {evt.description}
                </p>

                <div className="space-y-2 mt-6 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {typeof evt.venue === 'object' ? evt.venue.name : 'Convention Center'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Capacity: {evt.capacity} seats</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {evt.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button
                  className="w-full text-xs gap-1.5"
                  onClick={() => eventId && navigate(`/events/${eventId}`)}
                  disabled={!eventId}
                >
                  View Details & Passes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
