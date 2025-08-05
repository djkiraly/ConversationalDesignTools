import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Plus, X, Sparkles } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  journeyType: z.string().min(1, "Journey type is required"),
  customerPersona: z.string().min(1, "Customer persona is required"),
  businessGoals: z.string().min(1, "Business goals are required"),
  touchpoints: z.array(z.string()).min(1, "At least one touchpoint is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface GeminiJourneyDialogProps {
  onJourneyGenerated: (journeyData: any) => void;
  trigger?: React.ReactNode;
}

export default function GeminiJourneyDialog({ onJourneyGenerated, trigger }: GeminiJourneyDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [touchpointInput, setTouchpointInput] = useState("");
  const [touchpoints, setTouchpoints] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      journeyType: '',
      customerPersona: '',
      businessGoals: '',
      touchpoints: [],
    },
  });

  // Watch touchpoints to sync with form
  useEffect(() => {
    form.setValue('touchpoints', touchpoints);
  }, [touchpoints, form]);

  const generateJourney = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('POST', '/api/gemini/customer-journey', values);
    },
    onSuccess: (data) => {
      toast({
        title: "Journey Generated",
        description: "AI-powered customer journey has been created successfully.",
      });
      onJourneyGenerated(data);
      setOpen(false);
      form.reset();
      setTouchpoints([]);
      setTouchpointInput("");
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const addTouchpoint = () => {
    if (touchpointInput.trim() && !touchpoints.includes(touchpointInput.trim())) {
      setTouchpoints([...touchpoints, touchpointInput.trim()]);
      setTouchpointInput("");
    }
  };

  const removeTouchpoint = (index: number) => {
    setTouchpoints(touchpoints.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTouchpoint();
    }
  };

  const onSubmit = async (values: FormValues) => {
    generateJourney.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Build Flow with Gemini
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Build Flow with Gemini AI
          </DialogTitle>
          <DialogDescription>
            Provide details about your customer journey and let Gemini AI generate a comprehensive flow diagram.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="journeyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Journey Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., E-commerce Purchase, Customer Support, Onboarding"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What type of customer journey are you creating?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPersona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Persona</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your target customer persona, their demographics, needs, and pain points..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Who is your target customer for this journey?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What are your key business objectives for this journey? e.g., increase conversion, reduce churn, improve satisfaction..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    What do you want to achieve with this customer journey?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Key Touchpoints</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Website, Mobile App, Email, Phone Support"
                    value={touchpointInput}
                    onChange={(e) => setTouchpointInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    type="button" 
                    onClick={addTouchpoint}
                    disabled={!touchpointInput.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {touchpoints.map((touchpoint, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {touchpoint}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                        onClick={() => removeTouchpoint(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
              <FormDescription>
                Add the key touchpoints where customers interact with your business.
              </FormDescription>
              {touchpoints.length === 0 && (
                <p className="text-sm text-red-500">At least one touchpoint is required</p>
              )}
            </FormItem>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={generateJourney.isPending || touchpoints.length === 0}
                className="gap-2"
              >
                {generateJourney.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Journey
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}