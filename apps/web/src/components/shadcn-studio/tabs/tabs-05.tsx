'use client'

import { type LucideIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Tab {
  name: string
  value: string
  icon: LucideIcon
  content: React.ReactNode
}

interface TabsWithVerticalIconProps {
  tabs: Tab[]
  defaultValue?: string
  className?: string
}

export const TabsWithVerticalIcon = ({
  tabs,
  defaultValue,
  className = ''
}: TabsWithVerticalIconProps) => {
  return (
    <div className={`w-full ${className}`}>
      <Tabs defaultValue={defaultValue || tabs[0]?.value} className="gap-4">
        <TabsList className="h-full px-2 py-2 gap-1">
          {tabs.map(({ icon: Icon, name, value }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex flex-col items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3"
            >
              <Icon className="size-4 sm:size-5" />
              <span className="text-xs sm:text-sm">{name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TabsWithVerticalIcon
