import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Award,
  Eye,
  Users,
  CheckCircle2,
  TrendingUp,
  FileText,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { ProgressRing } from '../../../components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../stores/authStore';

export function SponsorDashboardPage() {
  const navigate = useNavigate();
  const { activeEventId } = useAuthStore();

  const [sponsorship, setSponsorship] = useState({
    companyName: 'CloudScale Systems',
    tier: 'Platinum Sponsor',
    status: 'confirmed',
    benefits: [
      'Prime Keynote Hall banner placement',
      'VIP Exhibition Booth (Level 1, #B-102)',
      '10 Full-access conference delegate passes',
      'Dedicated sponsor email broadcast',
    ],
    deliverables: [
      { id: 'del-1', title: 'High-Res Vector Brand Logo (.SVG)', status: 'approved', dueDate: '2026-11-01' },
      { id: 'del-2', title: 'Virtual Booth Video Reel (.MP4)', status: 'submitted', dueDate: '2026-11-10' },
      { id: 'del-3', title: 'Attendee Swag Bag Insert (.PDF)', status: 'pending', dueDate: '2026-11-15' },
    ],
  });

  const completedCount = sponsorship.deliverables.filter((d) => d.status === 'approved' || d.status === 'submitted').length;
  const progressPct = Math.round((completedCount / sponsorship.deliverables.length) * 100);

  const telemetryData = [
    { metric: 'Booth Visits', count: 480 },
    { metric: 'Badge Scans', count: 320 },
    { metric: 'Deck Downloads', count: 180 },
    { metric: 'Qualified Leads', count: 85 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Corporate Sponsor Portal"
        description="Deliverable fulfillment, tier perks, brand reach telemetry, and qualified lead metrics"
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/sponsor/deliverables')}
            className="gap-1.5 text-xs shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            Upload Deliverables
          </Button>
        }
      />

      {/* Package Tier & Progress Ring Banner */}
      <Card className="p-6 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="accent" className="font-semibold text-xs uppercase tracking-wider">
                {sponsorship.tier}
              </Badge>
              <Badge variant="success">Confirmed Allocation</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{sponsorship.companyName}</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Partnering on Cloud Native Summit 2026. Your deliverables checklist is tracked below for live event A/V and booth signage.
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60 shrink-0">
            <ProgressRing percentage={progressPct} size={64} strokeWidth={6} />
            <div>
              <div className="text-xs font-bold text-foreground">Fulfillment Status</div>
              <div className="text-[11px] text-muted-foreground">
                {completedCount} of {sponsorship.deliverables.length} submitted
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Telemetry Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Brand Impressions"
          value="18,400"
          trend="+34%"
          trendLabel="keynote + website"
          icon={Eye}
        />
        <StatCard
          title="Booth Check-Ins"
          value="480"
          trend="+18%"
          trendLabel="physical visitors"
          icon={Users}
        />
        <StatCard
          title="Session Reach"
          value="1,250"
          trend="+22%"
          trendLabel="sponsored track attendees"
          icon={TrendingUp}
        />
        <StatCard
          title="Qualified Leads"
          value="85"
          trend="+15%"
          trendLabel="contact opt-ins"
          icon={CheckCircle2}
        />
      </div>

      {/* Tier Benefits & Telemetry Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Benefits */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <CardTitle className="text-sm font-semibold">Allocated Package Perks</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </div>
            <ul className="space-y-2.5">
              {sponsorship.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-4 border-t border-border/40 mt-4 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Booth Coordinator: Level 1 Desk</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/sponsor/deliverables')}
              className="text-xs gap-1"
            >
              Deliverables <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        {/* Lead Telemetry Chart */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-semibold">Attendee Engagement Proxy</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="metric" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
