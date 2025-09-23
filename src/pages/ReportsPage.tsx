import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api-client";
import type { Subscription, Service, ServiceCategory } from "@shared/types";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { groupBy } from "@/lib/utils";
import { format } from "date-fns";
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];
export default function ReportsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [subsData, servicesData] = await Promise.all([
          api<Subscription[]>("/api/subscriptions"),
          api<Service[]>("/api/services"),
        ]);
        setSubscriptions(subsData);
        setServices(servicesData);
      } catch (error) {
        toast.error("Failed to fetch report data.", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const servicesById = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);
  const subscriptionsByCategory = useMemo(() => {
    if (loading) return [];
    const subsWithCategory = subscriptions.map(sub => ({
      ...sub,
      category: servicesById.get(sub.serviceId)?.category || 'Unknown'
    }));
    const grouped = groupBy(subsWithCategory, 'category');
    return Object.entries(grouped).map(([name, value]) => ({
      name: name as ServiceCategory | 'Unknown',
      value: value.length,
    }));
  }, [subscriptions, servicesById, loading]);
  const mrrOverTime = useMemo(() => {
    if (loading) return [];
    const monthlyData: { [key: string]: number } = {};
    subscriptions.forEach(sub => {
      const month = format(new Date(sub.renewalDate), 'yyyy-MM');
      monthlyData[month] = (monthlyData[month] || 0) + sub.cost;
    });
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        name: format(new Date(month), 'MMM yy'),
        mrr: total / 100,
      }));
  }, [subscriptions, loading]);
  const subscriptionsPerService = useMemo(() => {
    if (loading) return [];
    const serviceCounts = subscriptions.reduce((acc, sub) => {
      acc[sub.serviceId] = (acc[sub.serviceId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(serviceCounts)
      .map(([serviceId, count]) => ({
        name: servicesById.get(serviceId)?.name || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 services
  }, [subscriptions, servicesById, loading]);
  return (
    <div className="flex flex-col w-full">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reports
        </h1>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>MRR Over Time</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mrrOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Subscriptions by Category</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={subscriptionsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                    {subscriptionsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Top 10 Services by Subscription Count</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subscriptionsPerService} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}