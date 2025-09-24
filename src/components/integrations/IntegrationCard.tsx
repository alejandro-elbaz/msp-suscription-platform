import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Integration } from "@shared/types";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Clock } from "lucide-react";

interface IntegrationCardProps {
  integration: Integration;
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const isConnected = integration.status === 'connected';
  const Logo = integration.logo;
  
  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ease-in-out group">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-xl border-2 flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-background to-muted group-hover:scale-110 transition-transform">
            <Logo className="w-8 h-8" />
          </div>
          <Badge 
            variant={isConnected ? "default" : "secondary"} 
            className={isConnected ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-xl">{integration.name}</CardTitle>
          <CardDescription className="mt-2 line-clamp-2">
            {integration.description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        {integration.features && integration.features.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Key Features</p>
            <ul className="text-sm space-y-1">
              {integration.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {integration.syncCapabilities?.realTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Real-time</span>
            </div>
          )}
          {integration.security?.compliance && integration.security.compliance.length > 0 && (
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>{integration.security.compliance[0]}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full group-hover:bg-primary">
          <Link to={`/integrations/${integration.id}`}>
            {isConnected ? "Manage Integration" : "Connect Now"}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}