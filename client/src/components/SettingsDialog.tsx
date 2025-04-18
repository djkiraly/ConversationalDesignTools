import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Setting } from "@shared/schema";
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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  
  // Query to fetch settings
  const { 
    data: settings = [], 
    isLoading, 
    error 
  } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
    enabled: open, // Only fetch settings when dialog is open
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
      return apiRequest('PUT', `/api/settings/${key}`, { value });
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
      
      // Close the dialog after saving
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Error Loading Settings</DialogTitle>
            <DialogDescription className="text-gray-700">
              {(error as Error).message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => window.location.reload()}
              variant="default"
            >
              Reload Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI integration settings.
          </DialogDescription>
        </DialogHeader>
        
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
                        rows={4}
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
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateSetting.isPending || form.formState.isSubmitting}
                >
                  {updateSetting.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Saving...
                    </>
                  ) : "Save Settings"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}