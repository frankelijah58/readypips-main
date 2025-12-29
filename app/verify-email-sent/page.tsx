'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';

export default function VerifyEmailSent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white dark:bg-black">
      <div className="w-full max-w-md">
        <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-black dark:text-white">Check your email</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              We&apos;ve sent a verification link to <br />
              <span className="font-semibold text-black dark:text-white">{email || 'your email'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Click the link in the email to activate your account. If you don&apos;t see it, check your spam folder.
            </p>
            
            <div className="pt-4">
              <Link href="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Go to Login
                </Button>
              </Link>
            </div>

            <Link href="/register" className="inline-flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to registration
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}