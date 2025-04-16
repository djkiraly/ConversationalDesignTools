import { useState } from "react";
import { UseCase } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateUseCaseSchema } from "@shared/schema";
import { Expand, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface EditorProps {
  useCase: UseCase;
  isLoading: boolean;
  onSave: (data: Partial<UseCase>) => void;
}

const formSchema = updateUseCaseSchema.extend({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  conversationFlow: z.string().min(10, { message: "Please enter a valid conversation" }),
});

export default function Editor({ useCase, isLoading, onSave }: EditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: useCase?.title || "",
      description: useCase?.description || "",
      conversationFlow: useCase?.conversationFlow || "",
    },
    values: {
      title: useCase?.title || "",
      description: useCase?.description || "",
      conversationFlow: useCase?.conversationFlow || "",
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
  }

  function handleExport() {
    // Create a downloadable text file with the conversation flow
    const element = document.createElement("a");
    const file = new Blob([useCase.conversationFlow], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${useCase.title.replace(/\s+/g, '_')}_flow.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const editorClasses = `
    ${isFullscreen ? 'fixed inset-0 z-50' : 'md:w-1/2'} 
    border-r border-neutral-medium bg-white h-full flex flex-col
  `;
  
  if (isLoading) {
    return (
      <div className="md:w-1/2 border-r border-neutral-medium bg-white h-full flex flex-col p-6">
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-40 mb-8" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className={editorClasses}>
      <div className="p-4 border-b border-neutral-medium flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-neutral-dark">{useCase.title}</h2>
          <p className="text-sm text-neutral-dark/60">Define your conversation flow</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-neutral-dark/70 hover:text-neutral-dark hover:bg-neutral-light"
              >
                <Expand className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Case Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter use case name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Briefly describe this conversation flow"
                      className="h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="conversationFlow"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>Conversation Flow</FormLabel>
                    <div className="text-xs text-neutral-dark/60">
                      Use → to indicate flow direction
                    </div>
                  </div>
                  <div className="border border-neutral-medium rounded-md overflow-hidden">
                    <div className="bg-neutral-light px-3 py-2 border-b border-neutral-medium flex">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 mr-2 text-neutral-dark/70 hover:text-neutral-dark">
                        <span className="text-sm font-bold">B</span>
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 mr-2 text-neutral-dark/70 hover:text-neutral-dark">
                        <span className="text-sm italic">I</span>
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 mr-4 text-neutral-dark/70 hover:text-neutral-dark">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 mr-2 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-neutral-dark/70 hover:text-neutral-dark">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-96 resize-none"
                        placeholder={`Customer: I'm looking for a new laptop.\nAgent: I'd be happy to help you find a laptop! What will you be using it for?\n→\nCustomer: I need it for work and gaming.\n...`}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      
      <div className="p-4 border-t border-neutral-medium flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          className="flex items-center"
        >
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <div>
          <Button
            type="button"
            variant="ghost"
            className="mr-2"
            onClick={() => form.reset({
              title: useCase.title,
              description: useCase.description,
              conversationFlow: useCase.conversationFlow
            })}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            className="bg-primary hover:bg-primary-light text-white"
            disabled={!form.formState.isDirty}
          >
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
