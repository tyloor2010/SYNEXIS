import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  BookOpen,
  ChevronDown,
  Columns3,
  Database,
  Home,
  MapPin,
  Moon,
  Ruler,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const primaryItems = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/explorer', label: 'المستكشف', icon: Moon },
  { to: '/measure', label: 'القياس', icon: Ruler },
  { to: '/compare', label: 'المقارنة', icon: Columns3 },
  { to: '/learn', label: 'تعلّم', icon: BookOpen },
] as const;

export function SynexisHeader({ explorer = false }: { explorer?: boolean }) {
  const [menu, setMenu] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <header className="hero-header relative z-50 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border px-5 py-4 md:px-14">
      <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="SYNEXIS - الرئيسية">
        <span className="brand-mark shrink-0"><span /></span>
        <strong className="text-sm">SYNEXIS</strong>
      </Link>

      <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-1 lg:flex" aria-label="التنقل الرئيسي">
        {primaryItems.map((item) => (
          <Button
            asChild
            key={item.to}
            variant={(explorer && item.to === '/explorer') || pathname === item.to ? 'default' : 'ghost'}
            size="sm"
          >
            <Link to={item.to} aria-current={pathname === item.to ? 'page' : undefined}>
              <item.icon />{item.label}
            </Link>
          </Button>
        ))}
        <Button asChild variant={pathname.startsWith('/sites') ? 'default' : 'ghost'} size="sm">
          <Link to="/sites" aria-current={pathname.startsWith('/sites') ? 'page' : undefined}>
            <MapPin />المواقع
          </Link>
        </Button>
        <a
          href="/sources"
          aria-current={pathname === '/sources' ? 'page' : undefined}
          className={`inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${pathname === '/sources' ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Database className="h-4 w-4" />المصادر
        </a>
        <Button asChild variant={pathname === '/team' ? 'default' : 'ghost'} size="sm">
          <Link to="/team" aria-current={pathname === '/team' ? 'page' : undefined}>
            <Users />الفريق
          </Link>
        </Button>
      </nav>

      <Button
        className="lg:hidden"
        variant="outline"
        size="icon"
        aria-label={menu ? 'إغلاق القائمة' : 'فتح القائمة'}
        aria-expanded={menu}
        aria-controls="synexis-mobile-menu"
        onClick={() => setMenu((open) => !open)}
      >
        <ChevronDown className={menu ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </Button>

      {menu && (
        <nav
          id="synexis-mobile-menu"
          className="absolute inset-x-5 top-full grid gap-2 border border-border bg-background p-3 shadow-lg lg:hidden"
          aria-label="القائمة المنسدلة"
        >
          {primaryItems.map((item) => (
            <Button asChild variant={pathname === item.to ? 'default' : 'ghost'} key={item.to}>
              <Link to={item.to} aria-current={pathname === item.to ? 'page' : undefined} onClick={() => setMenu(false)}>
                <item.icon />{item.label}
              </Link>
            </Button>
          ))}
          <Button asChild variant={pathname.startsWith('/sites') ? 'default' : 'ghost'}>
            <Link to="/sites" onClick={() => setMenu(false)}><MapPin />المواقع</Link>
          </Button>
          <a href="/sources" onClick={() => setMenu(false)} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent">
            <Database className="h-4 w-4" />المصادر
          </a>
          <Button asChild variant={pathname === '/team' ? 'default' : 'ghost'}>
            <Link to="/team" onClick={() => setMenu(false)}><Users />الفريق</Link>
          </Button>
        </nav>
      )}

      <nav className="synexis-mobile-dock" aria-label="تنقل التطبيق">
        {primaryItems.map((item) => (
          <Button asChild variant={pathname === item.to ? 'default' : 'ghost'} key={item.to}>
            <Link to={item.to} aria-current={pathname === item.to ? 'page' : undefined} onClick={() => setMenu(false)}>
              <item.icon /><span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}
