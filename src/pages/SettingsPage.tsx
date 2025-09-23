import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "@/components/ui/sonner";
export default function SettingsPage() {
  const { isDark } = useTheme();
  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@nexusmsp.com");
  const handleSaveChanges = () => {
    // In a real application, you would handle the form submission here.
    toast.success("Profile changes saved successfully!");
  };
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application settings.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select a light or dark theme for the interface.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span>{isDark ? 'Dark' : 'Light'} Mode</span>
              <ThemeToggle className="relative top-0 right-0" />
            </div>
          </div>
        </CardContent>
      </Card>
      <footer className="text-center text-sm text-muted-foreground pt-4">
        Built with ❤️ at Cloudflare
      </footer>
    </div>
  );
}