import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Heart, 
  Baby, 
  Users2, 
  Sparkles,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { FamilyMember, SmartSuggestion } from '../../lib/types';
import { SmartSuggestionsEngine } from '../../lib/utils/SmartSuggestions';

interface SuggestedRelativesProps {
  selectedPerson: FamilyMember;
  allData: { [id: string]: FamilyMember };
  onAddRelative: (nodeId: string, type: "parent" | "spouse" | "child" | "sibling") => void;
  onConnectExisting?: (personId1: string, personId2: string, relationshipType: "parent" | "spouse" | "child" | "sibling") => void;
  isDarkMode: boolean;
  onClose?: () => void;
}

export const SuggestedRelatives: React.FC<SuggestedRelativesProps> = ({
  selectedPerson,
  allData,
  onAddRelative,
  onConnectExisting,
  isDarkMode,
  onClose
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const newSuggestions = SmartSuggestionsEngine.generateSuggestions(selectedPerson, allData);
    const fixes = SmartSuggestionsEngine.suggestRelationshipFixes(selectedPerson, allData);
    setSuggestions([...newSuggestions, ...fixes]);
  }, [selectedPerson, allData]);

  const filteredSuggestions = suggestions.filter(suggestion => 
    activeCategory === 'all' || suggestion.priority === activeCategory
  );

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getRelationshipIcon = (type: 'parent' | 'spouse' | 'child' | 'sibling') => {
    switch (type) {
      case 'parent':
        return <UserPlus className="w-4 h-4" />;
      case 'spouse':
        return <Heart className="w-4 h-4" />;
      case 'child':
        return <Baby className="w-4 h-4" />;
      case 'sibling':
        return <Users2 className="w-4 h-4" />;
    }
  };

  const handleSuggestionAction = (suggestion: SmartSuggestion) => {
    if (suggestion.suggestedPersonId && onConnectExisting) {
      // Connect to existing person
      onConnectExisting(suggestion.targetPersonId, suggestion.suggestedPersonId, suggestion.type);
    } else {
      // Add new person
      onAddRelative(suggestion.targetPersonId, suggestion.type);
    }
  };

  const suggestionCounts = {
    all: suggestions.length,
    high: suggestions.filter(s => s.priority === 'high').length,
    medium: suggestions.filter(s => s.priority === 'medium').length,
    low: suggestions.filter(s => s.priority === 'low').length,
  };

  return (
    <Card className={`w-full max-w-md ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Suggested Relatives
            </h3>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Selected Person Info */}
        <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className="text-sm font-medium">{selectedPerson.name}</p>
          <p className="text-xs text-gray-500">
            Born {selectedPerson.birth_year}
            {selectedPerson.death_year && ` - Died ${selectedPerson.death_year}`}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-1 mb-4 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
          {(['all', 'high', 'medium', 'low'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                activeCategory === category
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {category !== 'all' && getPriorityIcon(category)}
              <span className="capitalize">{category}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {suggestionCounts[category]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Suggestions List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No suggestions for this category</p>
              <p className="text-xs">Family tree looks complete!</p>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className={`p-3 hover:shadow-md transition-shadow ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Priority & Type Icons */}
                    <div className="flex flex-col items-center space-y-1">
                      {getPriorityIcon(suggestion.priority)}
                      <div className={`p-1 rounded ${
                        suggestion.type === 'parent' ? 'bg-amber-100 text-amber-600' :
                        suggestion.type === 'spouse' ? 'bg-pink-100 text-pink-600' :
                        suggestion.type === 'child' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {getRelationshipIcon(suggestion.type)}
                      </div>
                    </div>

                    {/* Suggestion Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{suggestion.label}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge 
                          variant={suggestion.priority === 'high' ? 'destructive' : 
                                  suggestion.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {suggestion.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">{suggestion.reason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant={suggestion.priority === 'high' ? 'default' : 'outline'}
                    onClick={() => handleSuggestionAction(suggestion)}
                    className="ml-2 flex-shrink-0"
                  >
                    {suggestion.suggestedPersonId ? (
                      <>
                        <span className="mr-1">Connect</span>
                        <ChevronRight className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span className="mr-1">Add</span>
                        <UserPlus className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing Person Info */}
                {suggestion.suggestedPersonId && (
                  <div className={`mt-3 p-2 rounded border-l-2 ${
                    suggestion.type === 'parent' ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                    suggestion.type === 'spouse' ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' :
                    suggestion.type === 'child' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
                    'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  }`}>
                    <p className="text-sm font-medium">
                      {allData[suggestion.suggestedPersonId]?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Born {allData[suggestion.suggestedPersonId]?.birth_year}
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Quick Action Footer */}
        {suggestions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{suggestions.length} suggestions found</span>
              <span>{suggestions.filter(s => s.priority === 'high').length} high priority</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};