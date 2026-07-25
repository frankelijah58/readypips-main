import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
      <div className="w-full max-w-md">
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <CardTitle className="text-2xl text-black dark:text-white">Page Not Found</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Link href="/">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full border-gray-300 dark:border-gray-600 text-black dark:text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 