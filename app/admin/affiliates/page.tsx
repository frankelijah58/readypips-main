"use client";
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Check, X } from "lucide-react";

const applicants = [
  { name: "John Doe", email: "john@example.com", method: "YouTube", status: "PENDING" },
  { name: "Sarah Smith", email: "sarah@blog.com", method: "SEO/Blog", status: "ACTIVE" },
  { name: "Mike Ross", email: "mike@twitter.com", method: "Social Media", status: "PENDING" },
];

export default function AdminAffiliates() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Affiliate Management</h1>
        <Badge variant="outline" className="px-4 py-1">Total Affiliates: 142</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </TableCell>
                  <TableCell>{user.method}</TableCell>
                  <TableCell>
                    <Badge className={user.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="text-red-600"><X className="w-4 h-4" /></Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><Check className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost"><MoreHorizontal className="w-4 h-4" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}