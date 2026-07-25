'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TradingViewTestPage() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    if (!username) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tradingview/test-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradingviewUsername: username }),
      });

      const data = await res.json();

      setResult({
        status: res.status,
        ok: res.ok,
        data,
      });
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-10 bg-white dark:bg-black">
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 TradingView Access Tester</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="TradingView username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Button onClick={runTest} disabled={loading}>
              {loading ? "Granting..." : "Grant Access"}
            </Button>

            {result && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                <Badge variant={result.ok ? "default" : "destructive"}>
                  {result.ok ? "SUCCESS" : "FAILED"}
                </Badge>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
