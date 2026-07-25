'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-context';

export default function DebugPage() {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [apiTest, setApiTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Get localStorage data
    const token = localStorage.getItem('token');
    const allData: any = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        allData[key] = localStorage.getItem(key);
      }
    }
    
    setLocalStorageData(allData);
  }, []);

  const testAuthAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApiTest({ error: 'No token found in localStorage' });
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setApiTest({
        status: response.status,
        ok: response.ok,
        data
      });
    } catch (error) {
      setApiTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Debug Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Authentication and system diagnostics
          </p>
        </div>

        {/* Auth Context Status */}
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔐 Auth Context Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auth Loading:</p>
                <Badge variant={authLoading ? 'default' : 'secondary'}>
                  {authLoading ? 'Loading...' : 'Complete'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Status:</p>
                <Badge variant={user ? 'default' : 'secondary'}>
                  {user ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>
            </div>
            
            {user && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Data:</h4>
                <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LocalStorage Data */}
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💾 LocalStorage Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* API Test */}
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧪 API Test
            </CardTitle>
            <CardDescription>
              Test the authentication API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testAuthAPI} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Testing...' : 'Test Auth API'}
              </Button>
              <Button 
                onClick={clearToken} 
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear Token
              </Button>
            </div>
            
            {apiTest && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">API Response:</h4>
                <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-auto">
                  {JSON.stringify(apiTest, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Check */}
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚙️ Environment Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Node Environment:</p>
                  <Badge variant="outline">{process.env.NODE_ENV || 'Not set'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Base URL:</p>
                  <Badge variant="outline">{process.env.NEXTAUTH_URL || 'Not set'}</Badge>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Important Note
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Make sure you have a <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.env.local</code> file 
                  with the required environment variables. Check <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">env.example</code> 
                  for the required variables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white dark:bg-gray-800 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-green-600 hover:bg-green-700"
              >
                Go to Login
              </Button>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 