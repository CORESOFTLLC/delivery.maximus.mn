'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, FolderTree, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

export type CategoryItem = {
  id: string
  name: string
  count?: number
}

type Props = {
  categories: CategoryItem[]
  categoriesLoading?: boolean
  selectedCategories: string[]
  onCategoryToggle: (categoryId: string) => void
  onClearAll: () => void
}

export function CategorySidebar({
  categories,
  categoriesLoading = false,
  selectedCategories,
  onCategoryToggle,
  onClearAll,
}: Props) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const activeFiltersCount = selectedCategories.length

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center gap-2">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
          {activeFiltersCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 lg:w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">{t('products.filterSheet.category')}</h3>
          {activeFiltersCount > 0 && (
            <Badge className="h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            {t('products.filterSheet.clear')} ({activeFiltersCount})
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Categories List */}
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-1">
              {categories.map(category => {
                const isSelected = selectedCategories.includes(category.id)
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryToggle(category.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <span className="truncate">{category.name}</span>
                    {category.count !== undefined && category.count > 0 && (
                      <span className={cn(
                        'text-xs ml-2 shrink-0',
                        isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {category.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground px-3 py-2">
              {t('products.filterSheet.noCategory')}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Selected Categories Summary */}
      {activeFiltersCount > 0 && (
        <div className="border-t border-gray-100 p-4">
          <p className="text-xs text-muted-foreground mb-2">
            {t('products.filterSheet.selected')}:
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map(catId => {
              const cat = categories.find(c => c.id === catId)
              return cat ? (
                <Badge
                  key={catId}
                  variant="secondary"
                  className="gap-1 text-xs cursor-pointer hover:bg-gray-200"
                  onClick={() => onCategoryToggle(catId)}
                >
                  {cat.name}
                  <X className="h-3 w-3" />
                </Badge>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
