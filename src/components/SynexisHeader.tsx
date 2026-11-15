import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ChevronDown, Moon, Home, Ruler, Columns3, BookOpen, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SynexisHeader({ explorer = false }: { explorer?: boolean }) {
  const [menu, setMenu] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  const items = [
    { to: '/', label: 'الرئيسية', icon: Home },
    { to: '/explorer', label: 'المستكشف', icon: Moon },
    { to: '/measure', label: 'القياس', icon: Ruler },
    { to: '/compare', label: 'المقارنة', icon: Columns3 },
    { to: '/learn', label: 'تعلّم', icon: BookOpen },
  ] as const;
  return (
    <header className="hero-header relative z-50 gap-4 border-b border-border px-5 py-5 md:px-14">
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <span className="brand-mark shrink-0">
          <span />
        </span>
        <strong className="text-sm">SYNEXIS</strong>
      </Link>
      <nav className="hidden flex-wrap items-center gap-2 lg:flex" aria-label="التنقل الرئيسي">
        {items.map((item) => (
          <Button
            asChild
            key={item.to}
            variant={explorer && item.to === '/explorer' ? 'default' : 'ghost'}
            size="sm"
          >
            <Link to={item.to}>
              <item.icon />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <Button
        className="lg:hidden"
        variant="outline"
        size="icon"
        aria-label="القائمة"
        aria-expanded={menu}
        onClick={() => setMenu(!menu)}
      >
        <ChevronDown />
      </Button>
      <Button asChild variant="ghost" className="hidden lg:inline-flex">
        <Link to="/sites">
          <MapPin />
          المواقع
        </Link>
      </Button>
      <Button asChild variant="ghost" className="hidden lg:inline-flex">
        <Link to="/team">
          <Users />
          الفريق
        </Link>
      </Button>
      {menu && (
        <nav
          className="absolute inset-x-5 top-full grid gap-2 border border-border bg-background p-3 lg:hidden"
          aria-label="القائمة المنسدلة"
        >
          {items.map((item) => (
            <Button asChild variant="ghost" key={item.to}>
              <Link to={item.to} onClick={() => setMenu(false)}>
                <item.icon />
                {item.label}
              </Link>
            </Button>
          ))}
          <Button asChild variant="ghost">
            <Link to="/sites" onClick={() => setMenu(false)}>
              <MapPin />
              المواقع
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/team" onClick={() => setMenu(false)}>
              <Users />
              الفريق
            </Link>
          </Button>
        </nav>
      )}
      <nav className="synexis-mobile-dock" aria-label="تنقل التطبيق">
        {items.map((item) => (
          <Button asChild variant={pathname === item.to ? 'default' : 'ghost'} key={item.to}>
            <Link
              to={item.to}
              aria-current={pathname === item.to ? 'page' : undefined}
              onClick={() => setMenu(false)}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}
