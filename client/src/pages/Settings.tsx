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
  // ROI calculation parameters
  roi_agent_hourly_cost: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid dollar amount (e.g., 25.50)"
  }),
  roi_implementation_cost_min: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid dollar amount"
  }),
  roi_implementation_cost_max: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid dollar amount"
  }),
  roi_maintenance_pct: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid percentage (e.g., 15)"
  }),
  roi_automation_rate_base: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid percentage"
  }),
  roi_automation_rate_scale: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid percentage"
  }),
  roi_csat_improvement_base: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid percentage"
  }),
  roi_csat_improvement_scale: z.string().refine(value => !value || /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Must be a valid percentage"
  }),
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
      // Default ROI parameters
      roi_agent_hourly_cost: '25',
      roi_implementation_cost_min: '15000',
      roi_implementation_cost_max: '100000',
      roi_maintenance_pct: '15',
      roi_automation_rate_base: '5',
      roi_automation_rate_scale: '25',
      roi_csat_improvement_base: '5',
      roi_csat_improvement_scale: '20',
    },
    values: {
      openai_api_key: getSettingValue('openai_api_key'),
      openai_system_prompt: getSettingValue('openai_system_prompt'),
      openai_user_prompt: getSettingValue('openai_user_prompt'),
      // ROI calculation parameters
      roi_agent_hourly_cost: getSettingValue('roi_agent_hourly_cost') || '25',
      roi_implementation_cost_min: getSettingValue('roi_implementation_cost_min') || '15000',
      roi_implementation_cost_max: getSettingValue('roi_implementation_cost_max') || '100000',
      roi_maintenance_pct: getSettingValue('roi_maintenance_pct') || '15',
      roi_automation_rate_base: getSettingValue('roi_automation_rate_base') || '5',
      roi_automation_rate_scale: getSettingValue('roi_automation_rate_scale') || '25',
      roi_csat_improvement_base: getSettingValue('roi_csat_improvement_base') || '5',
      roi_csat_improvement_scale: getSettingValue('roi_csat_improvement_scale') || '20',
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
      // Update OpenAI settings
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
      
      // Update ROI calculation parameters
      await updateSetting.mutateAsync({
        key: 'roi_agent_hourly_cost',
        value: values.roi_agent_hourly_cost
      });
      await updateSetting.mutateAsync({
        key: 'roi_implementation_cost_min',
        value: values.roi_implementation_cost_min
      });
      await updateSetting.mutateAsync({
        key: 'roi_implementation_cost_max',
        value: values.roi_implementation_cost_max
      });
      await updateSetting.mutateAsync({
        key: 'roi_maintenance_pct',
        value: values.roi_maintenance_pct
      });
      await updateSetting.mutateAsync({
        key: 'roi_automation_rate_base',
        value: values.roi_automation_rate_base
      });
      await updateSetting.mutateAsync({
        key: 'roi_automation_rate_scale',
        value: values.roi_automation_rate_scale
      });
      await updateSetting.mutateAsync({
        key: 'roi_csat_improvement_base',
        value: values.roi_csat_improvement_base
      });
      await updateSetting.mutateAsync({
        key: 'roi_csat_improvement_scale',
        value: values.roi_csat_improvement_scale
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
            Configure your OpenAI integration and ROI calculation parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* OpenAI Settings Section */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-medium">OpenAI Integration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure AI features that use OpenAI
                    </p>
                  </div>
                  
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
                </div>
                
                {/* ROI Calculation Parameters Section */}
                <div className="space-y-6">
                  <div className="border-b pb-2 pt-4">
                    <h3 className="text-lg font-medium">ROI Calculation Parameters</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure the parameters used for ROI projections in the Action Plan
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="roi_agent_hourly_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent Hourly Cost ($)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="25.00"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Average fully-loaded hourly cost of a human agent
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="roi_maintenance_pct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Maintenance (%)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="15"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of implementation cost for annual maintenance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="roi_implementation_cost_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Implementation Cost ($)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="15000"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum implementation cost for simple use cases
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="roi_implementation_cost_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Implementation Cost ($)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="100000"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum implementation cost for complex use cases
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border-t pt-4 pb-2">
                    <h4 className="text-md font-medium">Automation & Efficiency Parameters</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="roi_automation_rate_base"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Automation Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="5"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum percentage of tasks that can be automated
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="roi_automation_rate_scale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Automation Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="25"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum percentage of tasks that can be automated
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="roi_csat_improvement_base"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base CSAT Improvement (%)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="5"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum customer satisfaction improvement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="roi_csat_improvement_scale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max CSAT Improvement (%)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="20"
                              {...field} 
                              type="text"
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum customer satisfaction improvement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
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