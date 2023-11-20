import { useState, useEffect, useReducer, useCallback } from 'react';

import '@/globals.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Config from './Config';
import { Profile } from './Profile';
import { User2, Settings } from 'lucide-react';

const tabs = {
  profile: 'profile',
  config: 'config',
} as const;

type Tabs = (typeof tabs)[keyof typeof tabs];

export const Popup = () => {
  const [tab, setTab] = useState<Tabs>(tabs.profile);

  return (
    <main className="w-[440px] p-4">
      <Tabs value={tab} onValueChange={(val) => setTab(val as Tabs)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={tabs.profile}>
            <User2 className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value={tabs.config}>
            <Settings className="w-4 h-4 mr-2" /> Config
          </TabsTrigger>
        </TabsList>
        <TabsContent forceMount hidden={tab === tabs.config} value="profile">
          <Profile />
        </TabsContent>
        <TabsContent forceMount hidden={tab === tabs.profile} value="config">
          <Config />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Popup;
