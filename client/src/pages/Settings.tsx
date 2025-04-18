import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Setting } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  openai_api_key: z.string().optional(),
  openai_system_prompt: z.string().min(1, "System prompt is required"),
  openai_user_prompt: z.string().min(1, "User prompt is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { toast } = useToast();
  
  // Query to fetch settings
  const { 
    data: settings = [], 
    isLoading, 
    error 
  } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });

  // Find matching settings from the array
  const getSettingValue = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openai_api_key: '',
      openai_system_prompt: '',
      openai_user_prompt: '',
    },
    values: {
      openai_api_key: getSettingValue('openai_api_key'),
      openai_system_prompt: getSettingValue('openai_system_prompt'),
      openai_user_prompt: getSettingValue('openai_user_prompt'),
    }
  });

  // Update setting mutation
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest(`/api/settings/${key}`, 'PUT', { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update setting",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Form submit handler
  async function onSubmit(values: FormValues) {
    try {
      // Update each setting one by one
      await updateSetting.mutateAsync({ 
        key: 'openai_api_key', 
        value: values.openai_api_key || '' 
      });
      await updateSetting.mutateAsync({ 
        key: 'openai_system_prompt', 
        value: values.openai_system_prompt 
      });
      await updateSetting.mutateAsync({ 
        key: 'openai_user_prompt', 
        value: values.openai_user_prompt 
      });
      
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Settings</h2>
          <p className="text-gray-700 mb-4">{(error as Error).message}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="default"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure your OpenAI integration settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="openai_api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenAI API Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your OpenAI API key"
                          {...field} 
                          type="text"
                        />
                      </FormControl>
                      <FormDescription>
                        Your OpenAI API key used for AI-powered features.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="openai_system_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the system prompt for OpenAI"
                          {...field} 
                          rows={5}
                        />
                      </FormControl>
                      <FormDescription>
                        This system prompt defines how the AI assistant should behave.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="openai_user_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the user prompt template"
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt is used to format the user's message before sending to the AI.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit"
                  disabled={updateSetting.isPending || form.formState.isSubmitting}
                  className="w-full md:w-auto"
                >
                  {updateSetting.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Saving...
                    </>
                  ) : "Save Settings"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}