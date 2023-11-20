import { useState, useEffect, useReducer, useCallback } from 'react';
import {
  Credentials,
  ProfileInfo,
  StorageKeys,
  MessageSubject,
  MessageFrom,
  ErrorMessage,
} from '@/types';
import { ChromeStorage } from '@/lib/chrome-storage';
import { Input } from '@/components/ui/input';
import '@/globals.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

const configSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  code: z.string(),
});

export const Config = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorMessage>();

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
  });

  useEffect(() => {
    ChromeStorage.get(StorageKeys.CREDENTIALS).then((result) => {
      if (result?.refreshToken) setIsInitialized(true);

      if (result) {
        form.reset({
          ...result,
        });
      }
    });
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      console.log('message', msg);
      if (msg.subject === MessageSubject.FETCH_ERROR && msg.to === MessageFrom.CONFIG) {
        setError(msg.error);
        response();
      }
    });
  }, []);

  const saveToStorage = useCallback(() => {
    const state = form.getValues();
    ChromeStorage.set({ credentials: state });
  }, [form]);

  const onSubmit = (vals: z.infer<typeof configSchema>) => {
    ChromeStorage.set({ credentials: vals });
    setIsLoading(true);
    setIsInitialized(false);
    chrome.runtime.sendMessage(
      {
        from: MessageFrom.CONFIG,
        subject: MessageSubject.CREDENTIALS_SET,
      },
      (res: Credentials) => {
        setIsLoading(false);
        if (res.refreshToken) {
          setIsInitialized(true);
        }
      },
    );
  };

  return (
    <main className="min-w-[400px] p-6">
      <p className="text-[1rem] mb-4">
        You can get the credentials{' '}
        <a
          href="https://www.bigin.com/developer/docs/apis/register-client.html"
          target="_blank"
          className="underline"
        >
          here
        </a>{' '}
        (register a self client)
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client id</FormLabel>
                <FormControl>
                  <Input
                    id="clientId"
                    type="text"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      saveToStorage();
                      setIsInitialized(false);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client secret</FormLabel>
                <FormControl>
                  <Input
                    id="clientSecret"
                    type="text"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      saveToStorage();
                      setIsInitialized(false);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    id="code"
                    type="text"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      saveToStorage();
                      setIsInitialized(false);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <span className="w-full break-words text-muted-foreground mt-2">
            * Provide a scope with
            ZohoBigin.modules.Contacts.CREATE,ZohoSearch.securesearch.READ,ZohoBigin.modules.Contacts.READ
          </span>
          <Button type="submit" className="w-full" disabled={isInitialized}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </form>
      </Form>
      {isInitialized && (
        <span className="block text-sm text-muted-foreground mt-2">
          * Zoho client is initalized. You can make CRM queries now.
        </span>
      )}
      <span className="block text-[0.8rem] font-medium text-destructive break-all mt-2">
        {error?.message}
      </span>
    </main>
  );
};

export default Config;
