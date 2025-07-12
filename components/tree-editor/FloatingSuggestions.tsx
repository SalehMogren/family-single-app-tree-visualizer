import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles,
  X,
  UserPlus,
  Heart,
  Baby,
  Users2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FamilyMember, SmartSuggestion } from '../../lib/types';
import { SmartSuggestionsEngine } from '../../lib/utils/SmartSuggestions';

interface FloatingSuggestionsProps {
  selectedPerson: FamilyMember | null;
  allData: { [id: string]: FamilyMember };
  onAddRelative: (nodeId: string, type: "parent" | "spouse" | "child" | "sibling") => void;
  onConnectExisting?: (personId1: string, personId2: string, relationshipType: "parent" | "spouse" | "child" | "sibling") => void;
  isDarkMode: boolean;
  position?: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
}

export const FloatingSuggestions: React.FC<FloatingSuggestionsProps> = ({
  selectedPerson,
  allData,
  onAddRelative,
  onConnectExisting,
  isDarkMode,
  position = { x: 0, y: 0 },
  isVisible,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high'>('high');

  useEffect(() => {
    if (selectedPerson) {
      const newSuggestions = SmartSuggestionsEngine.generateSuggestions(selectedPerson, allData);
      const fixes = SmartSuggestionsEngine.suggestRelationshipFixes(selectedPerson, allData);
      setSuggestions([...newSuggestions, ...fixes]);
    }
  }, [selectedPerson, allData]);

  if (!isVisible || !selectedPerson) return null;

  const filteredSuggestions = suggestions.filter(suggestion => 
    priorityFilter === 'all' || suggestion.priority === priorityFilter
  );

  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');

  const getRelationshipIcon = (type: 'parent' | 'spouse' | 'child' | 'sibling') => {
    switch (type) {
      case 'parent':
        return <UserPlus className="w-3 h-3" />;
      case 'spouse':
        return <Heart className="w-3 h-3" />;
      case 'child':
        return <Baby className="w-3 h-3" />;
      case 'sibling':
        return <Users2 className="w-3 h-3" />;
    }
  };

  const handleSuggestionAction = (suggestion: SmartSuggestion) => {
    if (suggestion.suggestedPersonId && onConnectExisting) {
      onConnectExisting(suggestion.targetPersonId, suggestion.suggestedPersonId, suggestion.type);
    } else {
      onAddRelative(suggestion.targetPersonId, suggestion.type);
    }
    onClose();
  };

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 320), 
        top: Math.min(position.y, window.innerHeight - 400),
      }}
    >
      <Card className={`
        w-80 pointer-events-auto shadow-xl border-2
        ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        ${suggestions.length > 0 ? 'border-yellow-400' : ''}
      `}>
        {/* Header */}
        <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Smart Suggestions
                </span>
              </div>
              {highPrioritySuggestions.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {highPrioritySuggestions.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 w-6 p-0"
              >
                {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Person info */}
          <div className="mt-2">
            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {selectedPerson.name}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Born {selectedPerson.birth_year}
            </p>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No suggestions available
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Family tree looks complete!
                </p>
              </div>
            ) : (
              <>
                {/* Priority Filter */}
                <div className="flex space-x-1 mb-3 p-1 bg-gray-100 dark:bg-gray-800 rounded">
                  <button
                    onClick={() => setPriorityFilter('high')}
                    className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                      priorityFilter === 'high'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    High Priority ({highPrioritySuggestions.length})
                  </button>
                  <button
                    onClick={() => setPriorityFilter('all')}
                    className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                      priorityFilter === 'all'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    All ({suggestions.length})
                  </button>
                </div>

                {/* Suggestions List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredSuggestions.slice(0, 5).map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className={`p-2 rounded border hover:shadow-sm transition-all cursor-pointer ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSuggestionAction(suggestion)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className={`p-1 rounded ${
                            suggestion.type === 'parent' ? 'bg-amber-100 text-amber-600' :
                            suggestion.type === 'spouse' ? 'bg-pink-100 text-pink-600' :
                            suggestion.type === 'child' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {getRelationshipIcon(suggestion.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {suggestion.label}
                            </p>
                            <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {suggestion.reason}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs ml-2 flex-shrink-0"
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {filteredSuggestions.length > 5 && (
                    <div className={`text-center text-xs py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      +{filteredSuggestions.length - 5} more suggestions
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};