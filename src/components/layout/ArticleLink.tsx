'use client';

import { type ReactNode } from 'react';
import { useSidebar, type SidebarArticle } from '@/contexts/SidebarContext';

interface ArticleLinkProps {
  article: SidebarArticle;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps any clickable article content.
 * - Regular left-click → opens ArticleSidebar (AI analysis)
 * - Ctrl/Cmd+click, middle-click, right-click → opens source URL in new tab (native browser behaviour)
 */
export default function ArticleLink({ article, children, className }: ArticleLinkProps) {
  const { open } = useSidebar();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (Ctrl/Cmd/middle) pass through to the <a href>
    if (e.ctrlKey || e.metaKey || e.button === 1) return;
    e.preventDefault();
    open(article);
  };

  return (
    <a
      href={article.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={0}
      className={className}
      onClick={handleClick}
      style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
    >
      {children}
    </a>
  );
}
