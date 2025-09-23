import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Integration } from "@shared/types";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
interface IntegrationCardProps {
  integration: Integration;
}
export function IntegrationCard({ integration }: IntegrationCardProps) {
  const isConnected = integration.status === 'connected';
  const Logo = integration.logo;
  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0 bg-card">
          <Logo className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <CardTitle>{integration.name}</CardTitle>
          <Badge variant={isConnected ? "default" : "secondary"} className="mt-1">
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{integration.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/integrations/${integration.id}`}>
            {isConnected ? "Manage" : "Connect"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}