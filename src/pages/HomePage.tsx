import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Clock, Activity, AlertTriangle, UserPlus, FileText, Bell, Trash, Edit, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { DashboardStats, Activity as ActivityType } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
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
    { title: "Total MRR", value: stats ? (stats.totalMrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "...", icon: DollarSign, color: "text-green-500" },
    { title: "Active Clients", value: stats ? stats.activeClients : "...", icon: Users, color: "text-blue-500" },
    { title: "Active Subscriptions", value: stats ? stats.activeSubscriptionsCount : "...", icon: Activity, color: "text-indigo-500" },
    { title: "Services with Issues", value: stats ? stats.servicesWithIssues : "...", icon: AlertTriangle, color: "text-red-500" },
  ];
  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{kpi.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>MRR Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']} />
                  <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <AvatarFallback>{getActivityIcon(activity.type)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No recent activity.
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}