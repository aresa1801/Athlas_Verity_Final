'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShieldAlert, BarChart3, Settings } from 'lucide-react';
import { UserRole } from '@/lib/types/admin';

interface AdminNavigationProps {
  userRole?: UserRole;
  userName?: string;
}

/**
 * Admin Navigation Component
 * Shows admin/super-admin links based on user role
 * Add this to your main header component
 */
export function AdminNavigation({ userRole, userName }: AdminNavigationProps) {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  if (!isAdmin) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden sm:inline">Admin</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isSuperAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/super-admin" className="flex items-center gap-2 cursor-pointer">
                <ShieldAlert className="w-4 h-4" />
                <span>Super Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
              <BarChart3 className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {isSuperAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/super-admin?tab=settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="w-4 h-4" />
              <span>System Settings</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="text-xs text-muted-foreground">
          Role: {userRole?.replace('_', ' ')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * How to integrate into your header:
 *
 * In components/header/main-header.tsx or your main header component:
 *
 * import { AdminNavigation } from '@/components/admin/admin-navigation'
 * import { useAuth } from '@/hooks/use-auth' // or however you get user info
 *
 * export function MainHeader() {
 *   const { user } = useAuth()
 *
 *   return (
 *     <header>
 *       {/* ... other header content ... */}
 *       <AdminNavigation userRole={user?.role} userName={user?.name} />
 *     </header>
 *   )
 * }
 */
