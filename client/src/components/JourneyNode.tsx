import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, ShoppingCart, Bot, Repeat, HelpCircle, Brain, Star, Search, Check } from 'lucide-react';

interface JourneyNodeData {
  stepType: string;
  title: string;
  description: string;
  onNodeEdit?: (id: string, data: any) => void;
}

// Get appropriate icon and style for each step type
function getStepTypeStyles(stepType: string): { 
  bg: string, 
  text: string, 
  borderColor: string,
  icon: JSX.Element 
} {
  const normalizedType = stepType.toLowerCase();
  
  if (normalizedType.includes('entry') || normalizedType.includes('awareness')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: <MapPin className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('research')) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: <Search className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('evaluation') || normalizedType.includes('consideration')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      borderColor: 'border-amber-200',
      icon: <Brain className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('decision')) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      borderColor: 'border-orange-200',
      icon: <Star className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('purchase')) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      borderColor: 'border-green-200',
      icon: <ShoppingCart className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('contact') || normalizedType.includes('support')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: <HelpCircle className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('identification')) {
    return {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      borderColor: 'border-cyan-200',
      icon: <Bot className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('resolution')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      icon: <Check className="h-4 w-4" />
    };
  }
  
  if (normalizedType.includes('follow')) {
    return {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      borderColor: 'border-pink-200',
      icon: <Repeat className="h-4 w-4" />
    };
  }
  
  // Default
  return {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: <Users className="h-4 w-4" />
  };
}

export default function JourneyNode({ data, id }: NodeProps<JourneyNodeData>) {
  const { stepType, title, description, onNodeEdit } = data;
  const styles = getStepTypeStyles(stepType);
  
  const handleDoubleClick = () => {
    // Call the onNodeEdit function passed in the node data if available
    if (onNodeEdit && id) {
      onNodeEdit(id, { stepType, title, description });
    }
  };
  
  return (
    <div className="journey-node">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-600"
      />
      
      <Card 
        className={`w-64 shadow-md border-2 ${styles.borderColor} ${styles.bg} hover:shadow-lg transition-shadow cursor-pointer`}
        onDoubleClick={handleDoubleClick}
      >
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className={`px-2 py-1 ${styles.text} font-medium flex items-center gap-1`}>
              {styles.icon}
              <span>{stepType}</span>
            </Badge>
          </div>
          <CardTitle className={`text-lg mt-2 ${styles.text}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-600"
      />
    </div>
  );
}