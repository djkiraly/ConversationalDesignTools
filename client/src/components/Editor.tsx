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
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
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
                      Format with Customer/Agent labels and → arrows
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Formatting Instructions:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1 ml-5 list-disc">
                      <li><strong>Start each speaker with a label</strong>: "Customer:" or "Agent:"</li>
                      <li><strong>Keep labels on separate lines</strong> from their messages for best results</li>
                      <li><strong>Use → (arrow symbol) on its own line</strong> to indicate a new conversation step</li>
                      <li>Each conversation step should contain both Customer and Agent messages</li>
                    </ul>
                    <div className="bg-white p-2 rounded mt-2 text-xs border border-blue-100">
                      <code className="block whitespace-pre text-blue-800">
{`Customer:
I'm looking for a new laptop.

Agent:
I'd be happy to help you find a laptop! What will you be using it for?

→

Customer:
I need it for work and gaming.

Agent:
Great! I'll recommend our high-performance models.`}
                      </code>
                    </div>
                  </div>
                  
                  <div className="border border-neutral-medium rounded-md overflow-hidden">
                    <div className="bg-neutral-light px-3 py-2 border-b border-neutral-medium flex items-center">
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        className="mr-2 text-neutral-dark/90 hover:text-neutral-dark"
                        onClick={() => {
                          // Get the specific conversation flow textarea using the name attribute
                          const textArea = document.querySelector('textarea[name="conversationFlow"]') as HTMLTextAreaElement;
                          if (textArea) {
                            const start = textArea.selectionStart;
                            const value = field.value;
                            const newValue = value.substring(0, start) + '\n→\n' + value.substring(start);
                            field.onChange(newValue);
                            
                            // Set focus back to the textarea and restore cursor position after the inserted arrow
                            setTimeout(() => {
                              textArea.focus();
                              const newPosition = start + 3; // Length of \n→\n
                              textArea.setSelectionRange(newPosition, newPosition);
                            }, 0);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        Insert step arrow
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        className="mr-2 text-amber-600 hover:text-amber-700"
                        onClick={() => {
                          // Get the specific conversation flow textarea
                          const textArea = document.querySelector('textarea[name="conversationFlow"]') as HTMLTextAreaElement;
                          if (textArea) {
                            const start = textArea.selectionStart;
                            const value = field.value;
                            const newValue = value.substring(0, start) + '\nCustomer:\n' + value.substring(start);
                            field.onChange(newValue);
                            
                            // Set focus back to the textarea and move cursor after inserted text
                            setTimeout(() => {
                              textArea.focus();
                              const newPosition = start + 11; // Length of \nCustomer:\n
                              textArea.setSelectionRange(newPosition, newPosition);
                            }, 0);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Add Customer
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700"
                        onClick={() => {
                          // Get the specific conversation flow textarea
                          const textArea = document.querySelector('textarea[name="conversationFlow"]') as HTMLTextAreaElement;
                          if (textArea) {
                            const start = textArea.selectionStart;
                            const value = field.value;
                            const newValue = value.substring(0, start) + '\nAgent:\n' + value.substring(start);
                            field.onChange(newValue);
                            
                            // Set focus back to the textarea and move cursor after inserted text
                            setTimeout(() => {
                              textArea.focus();
                              const newPosition = start + 8; // Length of \nAgent:\n
                              textArea.setSelectionRange(newPosition, newPosition);
                            }, 0);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                        Add Agent
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-96 resize-none font-mono text-sm"
                        placeholder={`Customer:\nI'm looking for a new laptop.\n\nAgent:\nI'd be happy to help you find a laptop! What will you be using it for?\n\n→\n\nCustomer:\nI need it for work and gaming.\n\nAgent:\nGreat! I'll recommend our high-performance models.`}
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
