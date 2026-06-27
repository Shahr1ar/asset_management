"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, saveSettings } from "@/services/supabase/database-service";
import type { AppSettings } from "@/types";

export function SettingsView() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return null;
  }

  async function updateSettings(nextSettings: AppSettings) {
    try {
      setSettings(nextSettings);
      await saveSettings(nextSettings);
      toast.success("Settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Tune admin-only preferences and base console defaults."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Operational preferences</CardTitle>
            <CardDescription>Controls that affect how admins experience the panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
              <div>
                <p className="font-medium">Email alerts</p>
                <p className="text-sm text-muted-foreground">Notification preference for admin updates.</p>
              </div>
              <Button
                variant={settings.emailAlerts ? "default" : "secondary"}
                onClick={() =>
                  void updateSettings({ ...settings, emailAlerts: !settings.emailAlerts })
                }
              >
                {settings.emailAlerts ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System configuration</CardTitle>
            <CardDescription>Base defaults used by the admin console and reporting layer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currency">Default currency</Label>
              <Input
                id="currency"
                value={settings.defaultCurrency}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? { ...current, defaultCurrency: event.target.value.toUpperCase() }
                      : current,
                  )
                }
              />
            </div>
            <Button onClick={() => void updateSettings(settings)}>Save configuration</Button>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center gap-2">
                <p className="font-medium">Deployment target</p>
                <Badge>Vercel-ready</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Environment variables should be stored in Vercel project settings and mirrored in
                local `.env.local` for secure parity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
