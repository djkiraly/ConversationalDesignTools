import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Download, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Schema for form validation
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  customerId: z.number().nullable(),
  iterationCadence: z.string().nullable(),
  nextIterationDate: z.date().nullable(),
  dataCaptureMethods: z.array(z.string()).default([]),
  dataMetrics: z.array(z.string()).default([]),
  monitoringTools: z.string().nullable(),
  insightGenerationMethod: z.string().nullable(),
  keyPerformanceIndicators: z.array(z.string()).default([]),
  prioritizationFramework: z.string().nullable(),
  implementationPlan: z.string().nullable(),
  changeLog: z.array(
    z.object({
      date: z.string(),
      change: z.string(),
      impact: z.string(),
      status: z.string()
    })
  ).default([]),
  status: z.string().default("active")
});

type FormValues = z.infer<typeof formSchema>;

// Component for creating and viewing iteration tuning records
export default function IterationTuning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Form for creating new iteration tuning
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customerId: null,
      iterationCadence: null,
      nextIterationDate: null,
      dataCaptureMethods: [],
      dataMetrics: [],
      monitoringTools: null,
      insightGenerationMethod: null,
      keyPerformanceIndicators: [],
      prioritizationFramework: null,
      implementationPlan: null,
      changeLog: [],
      status: "active"
    }
  });

  // Form for editing existing iteration tuning
  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customerId: null,
      iterationCadence: null,
      nextIterationDate: null,
      dataCaptureMethods: [],
      dataMetrics: [],
      monitoringTools: null,
      insightGenerationMethod: null,
      keyPerformanceIndicators: [],
      prioritizationFramework: null,
      implementationPlan: null,
      changeLog: [],
      status: "active"
    }
  });

  // Temporary state for array inputs
  const [newDataCaptureMethod, setNewDataCaptureMethod] = useState("");
  const [newDataMetric, setNewDataMetric] = useState("");
  const [newKPI, setNewKPI] = useState("");
  const [newChangeLogItem, setNewChangeLogItem] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    change: "",
    impact: "",
    status: "planned"
  });

  // Query to get customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      return await apiRequest("/api/customers", {});
    }
  });

  // Query to get iteration tunings
  const { data: iterationTunings = [], isLoading } = useQuery({
    queryKey: ["/api/iteration-tunings"],
    queryFn: async () => {
      return await apiRequest("/api/iteration-tunings", {});
    }
  });

  // Mutation for creating new iteration tuning
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest("/api/iteration-tunings", {
        method: "POST",
        data: values
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iteration-tunings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Iteration tuning created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create iteration tuning",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating iteration tuning
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues & { id: number }) => {
      const { id, ...data } = values;
      return await apiRequest(`/api/iteration-tunings/${id}`, {
        method: "PUT",
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iteration-tunings"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Iteration tuning updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update iteration tuning",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting iteration tuning
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/iteration-tunings/${id}`, {
        method: "DELETE",
        data: {}
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iteration-tunings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Success",
        description: "Iteration tuning deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete iteration tuning",
        variant: "destructive"
      });
    }
  });

  // Filter tunings based on active tab
  const filteredTunings = iterationTunings.filter((tuning: any) => {
    if (activeTab === "all") return true;
    return tuning.status === activeTab;
  });

  // Handle form submission for creating new tuning
  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  // Handle form submission for editing tuning
  const onEditSubmit = (values: FormValues) => {
    if (!selectedTuning) return;
    updateMutation.mutate({
      ...values,
      id: selectedTuning.id
    });
  };

  // Helper function to add items to array fields
  const addToArray = (field: string, value: string) => {
    if (!value.trim()) return;
    const currentValues = form.getValues(field as any) || [];
    form.setValue(field as any, [...currentValues, value]);
  };

  // Helper function to remove items from array fields
  const removeFromArray = (field: string, index: number) => {
    const currentValues = form.getValues(field as any) || [];
    form.setValue(
      field as any,
      currentValues.filter((_: any, i: number) => i !== index)
    );
  };

  // Helper function to add items to array fields in edit form
  const addToEditArray = (field: string, value: string) => {
    if (!value.trim()) return;
    const currentValues = editForm.getValues(field as any) || [];
    editForm.setValue(field as any, [...currentValues, value]);
  };

  // Helper function to remove items from array fields in edit form
  const removeFromEditArray = (field: string, index: number) => {
    const currentValues = editForm.getValues(field as any) || [];
    editForm.setValue(
      field as any,
      currentValues.filter((_: any, i: number) => i !== index)
    );
  };

  // Helper function to add change log item to form
  const addChangeLogItem = () => {
    if (!newChangeLogItem.change.trim() || !newChangeLogItem.impact.trim()) return;
    const currentChangeLog = form.getValues("changeLog") || [];
    form.setValue("changeLog", [...currentChangeLog, newChangeLogItem]);
    setNewChangeLogItem({
      date: format(new Date(), "yyyy-MM-dd"),
      change: "",
      impact: "",
      status: "planned"
    });
  };

  // Helper function to add change log item to edit form
  const addEditChangeLogItem = () => {
    if (!newChangeLogItem.change.trim() || !newChangeLogItem.impact.trim()) return;
    const currentChangeLog = editForm.getValues("changeLog") || [];
    editForm.setValue("changeLog", [...currentChangeLog, newChangeLogItem]);
    setNewChangeLogItem({
      date: format(new Date(), "yyyy-MM-dd"),
      change: "",
      impact: "",
      status: "planned"
    });
  };

  // Helper function to remove change log item from form
  const removeChangeLogItem = (index: number) => {
    const currentChangeLog = form.getValues("changeLog") || [];
    form.setValue(
      "changeLog",
      currentChangeLog.filter((_: any, i: number) => i !== index)
    );
  };

  // Helper function to remove change log item from edit form
  const removeEditChangeLogItem = (index: number) => {
    const currentChangeLog = editForm.getValues("changeLog") || [];
    editForm.setValue(
      "changeLog",
      currentChangeLog.filter((_: any, i: number) => i !== index)
    );
  };

  // Helper function to open edit dialog with selected tuning
  const editTuning = (tuning: any) => {
    setSelectedTuning(tuning);
    editForm.reset({
      ...tuning,
      nextIterationDate: tuning.nextIterationDate ? new Date(tuning.nextIterationDate) : null
    });
    setIsEditDialogOpen(true);
  };

  // Helper function to confirm and delete tuning
  const confirmDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this iteration tuning?")) {
      deleteMutation.mutate(id);
    }
  };

  // Helper function to export iteration tuning as JSON
  const exportTuning = (tuning: any) => {
    // Create a JSON blob
    const data = JSON.stringify(tuning, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `iteration-tuning-${tuning.id}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Get customer name by ID
  const getCustomerName = (id: number | null) => {
    if (!id) return "N/A";
    const customer = customers.find((c: any) => c.id === id);
    return customer ? customer.companyName : "Unknown";
  };

  // Reset form when create dialog is closed
  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset();
    }
  }, [isCreateDialogOpen, form]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Iteration and Tuning</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Iteration Tuning
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Iteration Tuning</DialogTitle>
              <DialogDescription>
                Capture details about how your AI agent is being tuned and iterated upon.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Q1 2025 Agent Tuning Plan" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give this iteration tuning plan a descriptive title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value) || null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the customer this tuning plan applies to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iterationCadence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Iteration Cadence</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cadence" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often will you review and update the agent?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nextIterationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Next Iteration Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When is the next planned iteration?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormLabel>Data Capture Methods</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add data capture method"
                      value={newDataCaptureMethod}
                      onChange={(e) => setNewDataCaptureMethod(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={() => {
                        addToArray("dataCaptureMethods", newDataCaptureMethod);
                        setNewDataCaptureMethod("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("dataCaptureMethods")?.map((method, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {method}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 h-5 w-5 p-0"
                          onClick={() => removeFromArray("dataCaptureMethods", index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    How are you capturing data from the agent's interactions?
                  </FormDescription>
                </div>

                <div className="space-y-4">
                  <FormLabel>Data Metrics</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add data metric"
                      value={newDataMetric}
                      onChange={(e) => setNewDataMetric(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={() => {
                        addToArray("dataMetrics", newDataMetric);
                        setNewDataMetric("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("dataMetrics")?.map((metric, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {metric}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 h-5 w-5 p-0"
                          onClick={() => removeFromArray("dataMetrics", index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    What metrics are you tracking to evaluate performance?
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="monitoringTools"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monitoring Tools</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the tools used for monitoring"
                          className="resize-y"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        What tools are you using to monitor the agent's performance?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insightGenerationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insight Generation Method</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe how insights are generated from the data"
                          className="resize-y"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        How are you generating insights from the collected data?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Key Performance Indicators</FormLabel>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add KPI"
                      value={newKPI}
                      onChange={(e) => setNewKPI(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={() => {
                        addToArray("keyPerformanceIndicators", newKPI);
                        setNewKPI("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("keyPerformanceIndicators")?.map((kpi, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {kpi}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 h-5 w-5 p-0"
                          onClick={() => removeFromArray("keyPerformanceIndicators", index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <FormDescription>
                    What are the key metrics that determine success?
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="prioritizationFramework"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioritization Framework</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your prioritization framework"
                          className="resize-y"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        How do you prioritize which improvements to make?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="implementationPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Implementation Plan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your implementation plan"
                          className="resize-y"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        How will improvements be implemented and tested?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Change Log</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      placeholder="Date"
                      type="date"
                      value={newChangeLogItem.date}
                      onChange={(e) => setNewChangeLogItem({...newChangeLogItem, date: e.target.value})}
                    />
                    <Input
                      placeholder="Change description"
                      value={newChangeLogItem.change}
                      onChange={(e) => setNewChangeLogItem({...newChangeLogItem, change: e.target.value})}
                    />
                    <Input
                      placeholder="Impact"
                      value={newChangeLogItem.impact}
                      onChange={(e) => setNewChangeLogItem({...newChangeLogItem, impact: e.target.value})}
                    />
                    <div className="flex space-x-2">
                      <Select
                        value={newChangeLogItem.status}
                        onValueChange={(value) => setNewChangeLogItem({...newChangeLogItem, status: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={addChangeLogItem}>Add</Button>
                    </div>
                  </div>
                  
                  {form.watch("changeLog")?.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {form.watch("changeLog").map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{item.date}</td>
                              <td className="px-6 py-4 text-sm">{item.change}</td>
                              <td className="px-6 py-4 text-sm">{item.impact}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge variant={
                                  item.status === "completed" ? "default" :
                                  item.status === "in_progress" ? "secondary" :
                                  item.status === "planned" ? "outline" : "destructive"
                                }>
                                  {item.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeChangeLogItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <FormDescription>
                    Track changes made to the agent during this iteration.
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Current status of this iteration tuning plan.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Iteration Tuning"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredTunings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No iteration tuning records found.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create Your First Iteration Tuning
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTunings.map((tuning: any) => (
                <Card key={tuning.id} className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{tuning.title}</CardTitle>
                        <CardDescription>
                          Customer: {getCustomerName(tuning.customerId)}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        tuning.status === "active" ? "default" :
                        tuning.status === "completed" ? "secondary" :
                        tuning.status === "on_hold" ? "outline" : "destructive"
                      }>
                        {tuning.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold">Iteration Cadence:</span> {tuning.iterationCadence || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold">Next Iteration:</span> {tuning.nextIterationDate ? format(new Date(tuning.nextIterationDate), "PPP") : "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold">Data Metrics:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tuning.dataMetrics && tuning.dataMetrics.length > 0 
                            ? tuning.dataMetrics.map((metric: string, i: number) => (
                                <Badge key={i} variant="outline">{metric}</Badge>
                              ))
                            : <span className="text-muted-foreground text-sm">None defined</span>
                          }
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">KPIs:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tuning.keyPerformanceIndicators && tuning.keyPerformanceIndicators.length > 0 
                            ? tuning.keyPerformanceIndicators.map((kpi: string, i: number) => (
                                <Badge key={i} variant="outline">{kpi}</Badge>
                              ))
                            : <span className="text-muted-foreground text-sm">None defined</span>
                          }
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Changes:</span> {tuning.changeLog ? tuning.changeLog.length : 0} recorded
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => editTuning(tuning)}>
                      Edit
                    </Button>
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => exportTuning(tuning)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => confirmDelete(tuning.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Iteration Tuning</DialogTitle>
            <DialogDescription>
              Update the details of this iteration tuning plan.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Q1 2025 Agent Tuning Plan" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give this iteration tuning plan a descriptive title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value) || null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the customer this tuning plan applies to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="iterationCadence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Iteration Cadence</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cadence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often will you review and update the agent?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="nextIterationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Next Iteration Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When is the next planned iteration?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>Data Capture Methods</FormLabel>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add data capture method"
                    value={newDataCaptureMethod}
                    onChange={(e) => setNewDataCaptureMethod(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={() => {
                      addToEditArray("dataCaptureMethods", newDataCaptureMethod);
                      setNewDataCaptureMethod("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.watch("dataCaptureMethods")?.map((method, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {method}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-5 w-5 p-0"
                        onClick={() => removeFromEditArray("dataCaptureMethods", index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  How are you capturing data from the agent's interactions?
                </FormDescription>
              </div>

              <div className="space-y-4">
                <FormLabel>Data Metrics</FormLabel>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add data metric"
                    value={newDataMetric}
                    onChange={(e) => setNewDataMetric(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={() => {
                      addToEditArray("dataMetrics", newDataMetric);
                      setNewDataMetric("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.watch("dataMetrics")?.map((metric, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {metric}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-5 w-5 p-0"
                        onClick={() => removeFromEditArray("dataMetrics", index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  What metrics are you tracking to evaluate performance?
                </FormDescription>
              </div>

              <FormField
                control={editForm.control}
                name="monitoringTools"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitoring Tools</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the tools used for monitoring"
                        className="resize-y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      What tools are you using to monitor the agent's performance?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="insightGenerationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insight Generation Method</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how insights are generated from the data"
                        className="resize-y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      How are you generating insights from the collected data?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Key Performance Indicators</FormLabel>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add KPI"
                    value={newKPI}
                    onChange={(e) => setNewKPI(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={() => {
                      addToEditArray("keyPerformanceIndicators", newKPI);
                      setNewKPI("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.watch("keyPerformanceIndicators")?.map((kpi, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {kpi}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-5 w-5 p-0"
                        onClick={() => removeFromEditArray("keyPerformanceIndicators", index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  What are the key metrics that determine success?
                </FormDescription>
              </div>

              <FormField
                control={editForm.control}
                name="prioritizationFramework"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritization Framework</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your prioritization framework"
                        className="resize-y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      How do you prioritize which improvements to make?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="implementationPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Implementation Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your implementation plan"
                        className="resize-y"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      How will improvements be implemented and tested?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Change Log</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Date"
                    type="date"
                    value={newChangeLogItem.date}
                    onChange={(e) => setNewChangeLogItem({...newChangeLogItem, date: e.target.value})}
                  />
                  <Input
                    placeholder="Change description"
                    value={newChangeLogItem.change}
                    onChange={(e) => setNewChangeLogItem({...newChangeLogItem, change: e.target.value})}
                  />
                  <Input
                    placeholder="Impact"
                    value={newChangeLogItem.impact}
                    onChange={(e) => setNewChangeLogItem({...newChangeLogItem, impact: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Select
                      value={newChangeLogItem.status}
                      onValueChange={(value) => setNewChangeLogItem({...newChangeLogItem, status: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addEditChangeLogItem}>Add</Button>
                  </div>
                </div>
                
                {editForm.watch("changeLog")?.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editForm.watch("changeLog").map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.date}</td>
                            <td className="px-6 py-4 text-sm">{item.change}</td>
                            <td className="px-6 py-4 text-sm">{item.impact}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge variant={
                                item.status === "completed" ? "default" :
                                item.status === "in_progress" ? "secondary" :
                                item.status === "planned" ? "outline" : "destructive"
                              }>
                                {item.status.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeEditChangeLogItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <FormDescription>
                  Track changes made to the agent during this iteration.
                </FormDescription>
              </div>

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current status of this iteration tuning plan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Iteration Tuning"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}