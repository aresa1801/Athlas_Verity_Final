import { Metadata } from 'next';
import { Users, BarChart3, Settings, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersManagement } from '@/components/admin/super-admin/users-management';

export const metadata: Metadata = {
  title: 'Super Admin Dashboard - Athlas Verity',
  description: 'System administration and user management dashboard',
};

export default function SuperAdminPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-8 bg-gradient-to-b from-background to-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-8 h-8 text-red-600" />
                Super Admin Dashboard
              </h1>
              <p className="text-muted-foreground">System administration and role management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>System Stats</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions across the system</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground mt-1">System-wide users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground mt-1">Active administrators</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Good</div>
                  <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Database Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground mt-1">Total storage used</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Detailed system performance and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Metrics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Verification Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure default verification status workflows and requirements
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Auto-approve submissions</span>
                        <span className="text-muted-foreground">Disabled</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Require image validation</span>
                        <span className="text-muted-foreground">Enabled</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Default review timeout (days)</span>
                        <span className="text-muted-foreground">7</span>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Security Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">Manage security policies and access controls</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Two-factor authentication</span>
                        <span className="text-muted-foreground">Optional</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Session timeout (hours)</span>
                        <span className="text-muted-foreground">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>IP whitelist enabled</span>
                        <span className="text-muted-foreground">Disabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
