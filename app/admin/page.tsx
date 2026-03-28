'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { SubmissionsList } from '@/components/admin/admin-dashboard/submissions-list';
import { SubmissionDetail } from '@/components/admin/admin-dashboard/submission-detail';

interface SelectedSubmission {
  id: string;
  user_id: string;
  user?: { email: string; full_name: string };
  project_name: string;
  project_location: string;
  project_description: string | null;
  status: string;
  verification_type: string;
  submitted_at: string;
  created_at: string;
  [key: string]: any;
}

export default function AdminPage() {
  const [selectedSubmission, setSelectedSubmission] = useState<SelectedSubmission | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectSubmission = (submission: any) => {
    setSelectedSubmission(submission);
  };

  const handleCloseDetail = () => {
    setSelectedSubmission(null);
  };

  const handleStatusChange = () => {
    setRefreshTrigger(prev => prev + 1);
    handleCloseDetail();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-8 bg-gradient-to-b from-background to-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Review and manage verification submissions, approve projects for catalog
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {selectedSubmission ? (
          <SubmissionDetail
            submission={selectedSubmission}
            onClose={handleCloseDetail}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all" className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">All Submissions</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Pending</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Approved</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <span>Stats</span>
              </TabsTrigger>
            </TabsList>

            {/* All Submissions Tab */}
            <TabsContent value="all" key={`all-${refreshTrigger}`}>
              <Card>
                <CardHeader>
                  <CardTitle>All Submissions</CardTitle>
                  <CardDescription>
                    View and manage all verification submissions across all types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubmissionsList onSelectSubmission={handleSelectSubmission} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Tab */}
            <TabsContent value="pending" key={`pending-${refreshTrigger}`}>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Review</CardTitle>
                  <CardDescription>Submissions awaiting admin review or requiring revision</CardDescription>
                </CardHeader>
                <CardContent>
                  <SubmissionsList onSelectSubmission={handleSelectSubmission} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved" key={`approved-${refreshTrigger}`}>
              <Card>
                <CardHeader>
                  <CardTitle>Approved Projects</CardTitle>
                  <CardDescription>Projects that have been approved and published to catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <SubmissionsList onSelectSubmission={handleSelectSubmission} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground mt-1">Across all types</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">-</div>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">-</div>
                    <p className="text-xs text-muted-foreground mt-1">In catalog</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Green Carbon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground mt-1">Submissions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Blue Carbon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground mt-1">Submissions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Renewable Energy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-xs text-muted-foreground mt-1">Submissions</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
