'use client';

import { isPlatformSuperAdmin } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  Contact,
  CreditCard,
  Download,
  LayoutDashboard,
  Menu,
  Shield,
  Users,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { CommandPalette } from '@/components/admin/command-palette';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/contacts', label: 'Contacts', icon: Contact },
  { href: '/admin/sessions', label: 'Sessions', icon: CalendarDays },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/audit-log', label: 'Audit Log', icon: Shield },
  { href: '/admin/export', label: 'Export', icon: Download },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
] as const;

function NavLinks({
  pathname,
  isSuperAdmin,
  onNavigate,
  className,
  collapsed = false,
}: {
  pathname: string;
  isSuperAdmin: boolean;
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  const items = isSuperAdmin
    ? [...navItems, { href: '/admin/organizations', label: 'Organizations', icon: Users }]
    : navItems;

  return (
    <nav className={cn('flex-1 space-y-1 px-3 py-4', className)}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center rounded-lg transition-colors duration-150',
              collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5 text-sm',
              active
                ? 'bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-medium'
                : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminDrawer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isSuperAdmin = isPlatformSuperAdmin(useAuthStore((s) => s.user?.role));
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      {/* Sidebar - Desktop & Tablet */}
      <aside className="hidden md:flex shrink-0 flex-col border-r border-border bg-zinc-50 dark:bg-zinc-900 transition-all duration-200 md:w-[72px] lg:w-64">
        {/* Header */}
        <div className="flex h-16 items-center px-4 font-semibold tracking-tight border-b border-border justify-center lg:justify-start lg:px-6">
          <span className="hidden lg:inline">CardVault Admin</span>
          <span className="inline lg:hidden text-xs">CV</span>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto">
          {/* Expanded links on desktop */}
          <div className="hidden lg:block">
            <NavLinks pathname={pathname} isSuperAdmin={isSuperAdmin} />
          </div>
          {/* Collapsed links on tablet */}
          <div className="block lg:hidden">
            <NavLinks pathname={pathname} isSuperAdmin={isSuperAdmin} collapsed={true} />
          </div>
        </div>

        {/* Footer Area with Theme Toggle & User Info & Logout */}
        <div className="border-t border-border p-3 space-y-2">
          {/* User initials & email - only visible on desktop */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-3 p-2 rounded-lg bg-zinc-150 dark:bg-zinc-800/40 border border-border/40">
              <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-foreground">
                  {currentUser.fullName || 'User'}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col lg:flex-row items-center gap-1.5 justify-center lg:justify-between px-1">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              type="button"
              title="Sign Out"
              className="h-8 w-8 lg:h-auto lg:w-auto rounded-lg flex items-center justify-center gap-2 text-zinc-500 hover:text-red-650 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 lg:hover:bg-transparent lg:dark:hover:bg-transparent lg:px-3 lg:py-1.5 lg:text-xs"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="text-sm font-semibold text-foreground">CardVault Admin</span>
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-canvas">{children}</main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-zinc-900 text-white md:hidden"
            >
              <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800">
                <span className="font-semibold text-zinc-50">CardVault Admin</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <NavLinks pathname={pathname} isSuperAdmin={isSuperAdmin} onNavigate={() => setOpen(false)} />
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="border-t border-zinc-850 p-4 space-y-3">
                {currentUser && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-zinc-50">
                        {currentUser.fullName || 'User'}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-50"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="h-4 w-4" aria-hidden="true" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4" aria-hidden="true" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={logout}
                    type="button"
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
      <CommandPalette />
    </div>
  );
}
