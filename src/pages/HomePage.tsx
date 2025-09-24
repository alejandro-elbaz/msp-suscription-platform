import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Clock, Activity, AlertTriangle, UserPlus, FileText, Bell, Trash, Edit, Briefcase, Layers, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { DashboardStats, Activity as ActivityType } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getActivityIcon = (type: ActivityType['type']) => {
    switch (type) {
      case 'client_created': return <UserPlus className="h-4 w-4" />;
      case 'client_updated': return <Edit className="h-4 w-4" />;
      case 'client_deleted': return <Trash className="h-4 w-4 text-destructive" />;
      case 'subscription_created': return <FileText className="h-4 w-4" />;
      case 'subscription_deleted': return <FileText className="h-4 w-4 text-destructive" />;
      case 'service_created': return <Briefcase className="h-4 w-4" />;
      case 'service_updated': return <Edit className="h-4 w-4" />;
      case 'service_deleted': return <Trash className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api<DashboardStats>("/api/dashboard-stats");
        setStats(data);
      } catch (error) {
        toast.error("Failed to load dashboard data.", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpiData = [
    { 
      title: "Total MRR", 
      value: stats ? (stats.totalMrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "...", 
      icon: DollarSign, 
      color: "text-green-500",
      subtitle: "Monthly Recurring Revenue"
    },
    { 
      title: "Active Clients", 
      value: stats ? stats.activeClients : "...", 
      icon: Users, 
      color: "text-blue-500",
      subtitle: `${stats?.activeSubscriptionsCount || 0} subscriptions`
    },
    { 
      title: "Seats Managed", 
      value: stats ? stats.totalSeatsManaged : "...", 
      icon: Layers, 
      color: "text-purple-500",
      subtitle: `${stats?.licenseUtilization || 0}% utilized`
    },
    { 
      title: "Service Health", 
      value: stats ? stats.servicesWithIssues : "...", 
      icon: AlertTriangle, 
      color: stats?.servicesWithIssues === 0 ? "text-green-500" : "text-red-500",
      subtitle: stats?.servicesWithIssues === 0 ? "All services healthy" : "Issues detected"
    },
  ];

  const pieData = stats ? [
    { name: 'Internal', value: stats.internalVsExternalSplit.internal, color: 'hsl(var(--primary))' },
    { name: 'Client', value: stats.internalVsExternalSplit.external, color: 'hsl(var(--muted-foreground))' }
  ] : [];

  return (
    <div className="flex flex-col w-full space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            MSP Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your managed services and subscriptions
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Real-time
        </Badge>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-3/4" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* MRR Trend Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toLocaleString()}`} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right Side Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Subscription Split */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscription Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : stats && (
                <div className="flex items-center justify-between">
                  <div className="w-[140px] h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-sm">Internal: {stats.internalVsExternalSplit.internal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                      <span className="text-sm">Client: {stats.internalVsExternalSplit.external}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Services by Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : (
                stats?.topServices.map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{service.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.clientCount} {service.clientCount === 1 ? 'client' : 'clients'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{service.totalSeats} seats</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))
            ) : (
              stats?.recentActivity?.length ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-muted">
                        {getActivityIcon(activity.type)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No recent activity.
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}