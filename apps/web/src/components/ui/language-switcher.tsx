/**
 * Language Switcher Component
 * Toggle between Mongolian, English and Korean
 */
'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'mn' as const, name: 'Монгол', flag: '🇲🇳' },
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'ko' as const, name: '한국어', flag: '🇰🇷' },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();
  
  const currentLang = languages.find(l => l.code === locale) || languages[0];

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("h-9 w-9", className)}>
            <Languages className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={cn(
                "cursor-pointer",
                locale === lang.code && "bg-primary/10 text-primary"
              )}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 h-8 px-2", className)}
          >
            <span>{currentLang.flag}</span>
            <span className="text-xs font-medium">{currentLang.code.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={cn(
                "cursor-pointer",
                locale === lang.code && "bg-primary/10 text-primary"
              )}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 h-9", className)}>
          <span>{currentLang.flag}</span>
          <span className="hidden sm:inline">{currentLang.name}</span>
          <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={cn(
              "cursor-pointer",
              locale === lang.code && "bg-primary/10 text-primary"
            )}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
