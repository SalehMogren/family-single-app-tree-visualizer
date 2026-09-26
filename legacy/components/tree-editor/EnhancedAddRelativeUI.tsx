import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Baby, 
  Users2, 
  Sparkles,
  ChevronRight,
  User,
  Crown,
  Heart as RingIcon
} from 'lucide-react';
import { FamilyMember, SmartSuggestion, RelationshipConnection } from '../../lib/types';
import { SmartSuggestionsEngine } from '../../lib/utils/SmartSuggestions';
import { 
  getParentIds, 
  getChildIds, 
  getSpouseIds, 
  getSiblingIds 
} from '../../lib/utils/relationshipHelpers';

interface EnhancedAddRelativeUIProps {
  selectedPerson: FamilyMember;
  allData: { [id: string]: FamilyMember };
  relationships: RelationshipConnection[];
  onAddRelative: (nodeId: string, type: "parent" | "spouse" | "child" | "sibling") => void;
  isDarkMode: boolean;
}

interface RelativeOption {
  type: "parent" | "spouse" | "child" | "sibling";
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  description: string;
  placeholder: string;
  suggestions: string[];
}

export const EnhancedAddRelativeUI: React.FC<EnhancedAddRelativeUIProps> = ({
  selectedPerson,
  allData,
  relationships,
  onAddRelative,
  isDarkMode
}) => {
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'quick' | 'smart' | 'advanced'>('quick');

  useEffect(() => {
    const suggestions = SmartSuggestionsEngine.generateSuggestions(selectedPerson, allData, relationships);
    const fixes = SmartSuggestionsEngine.suggestRelationshipFixes(selectedPerson, allData, relationships);
    setSmartSuggestions([...suggestions, ...fixes]);
  }, [selectedPerson, allData, relationships]);

  const relativeOptions: RelativeOption[] = [
    {
      type: 'parent',
      label: 'إضافة والد/والدة',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
      hoverColor: 'hover:from-amber-600 hover:to-orange-700',
      description: 'إضافة الأم أو الأب',
      placeholder: 'موقع الوالد/الوالدة',
      suggestions: ['أب', 'أم', 'والد', 'والدة', 'زوج الأم', 'زوجة الأب']
    },
    {
      type: 'spouse',
      label: 'إضافة زوج/زوجة',
      icon: <RingIcon className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-pink-500 to-rose-600',
      hoverColor: 'hover:from-pink-600 hover:to-rose-700',
      description: 'إضافة الزوج أو الزوجة',
      placeholder: 'موقع الزوج/الزوجة',
      suggestions: ['زوجة', 'زوج', 'شريك', 'طليقة', 'طليق']
    },
    {
      type: 'child',
      label: 'إضافة طفل',
      icon: <Baby className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
      description: 'إضافة ابن أو ابنة',
      placeholder: 'موقع الطفل',
      suggestions: ['ابن', 'ابنة', 'ابن بالتبني', 'ابنة بالتبني', 'ربيب', 'ربيبة']
    },
    {
      type: 'sibling',
      label: 'إضافة شقيق/شقيقة',
      icon: <Users2 className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      hoverColor: 'hover:from-purple-600 hover:to-indigo-700',
      description: 'إضافة أخ أو أخت',
      placeholder: 'موقع الشقيق/الشقيقة',
      suggestions: ['أخ', 'أخت', 'أخ غير شقيق', 'أخت غير شقيقة', 'أخ بالزواج', 'أخت بالزواج']
    }
  ];

  const getRelationshipCounts = () => {
    return {
      parents: getParentIds(selectedPerson.id, relationships).length,
      spouses: getSpouseIds(selectedPerson.id, relationships).length,
      children: getChildIds(selectedPerson.id, relationships).length,
      siblings: getSiblingIds(selectedPerson.id, relationships).length
    };
  };

  const isRelationshipDisabled = (type: string) => {
    const counts = getRelationshipCounts();
    if (type === 'parent' && counts.parents >= 2) return true;
    if (type === 'sibling' && counts.parents === 0) return true;
    return false;
  };

  const renderQuickAddSection = () => (
    <div className="space-y-6">
      {/* Node-shaped Add Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {relativeOptions.map((option) => {
          const disabled = isRelationshipDisabled(option.type);
          const counts = getRelationshipCounts();
          const currentCount = counts[option.type as keyof typeof counts];
          
          return (
            <div key={option.type} className="relative">
              <Button
                onClick={() => onAddRelative(selectedPerson.id, option.type)}
                disabled={disabled}
                className={`
                  w-full h-20 ${option.color} ${option.hoverColor} 
                  text-white font-semibold shadow-lg border-0
                  transform transition-all duration-200 
                  hover:scale-105 hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed
                  rounded-xl
                `}
              >
                <div className="flex flex-col items-center space-y-2">
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </div>
              </Button>
              
              {/* Count Badge */}
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-white text-gray-800 shadow-md"
              >
                {currentCount}
              </Badge>
              
              {/* Placeholder Preview */}
              <div className={`
                absolute inset-0 flex items-center justify-center
                bg-gray-200 dark:bg-gray-700 rounded-xl border-2 border-dashed
                opacity-0 hover:opacity-30 transition-opacity duration-200
                pointer-events-none
              `}>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {option.placeholder}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Relationship Status Grid */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {Object.entries(getRelationshipCounts()).map(([key, count]) => (
          <div 
            key={key}
            className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <span className="capitalize font-medium">{key}</span>
            <Badge variant="outline" className="mt-1">{count}</Badge>
          </div>
        ))}
      </div>

      {/* Quick Suggestions */}
      {smartSuggestions.slice(0, 3).map((suggestion) => (
        <div 
          key={suggestion.id}
          className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{suggestion.icon}</span>
            <div>
              <p className="font-medium text-sm">{suggestion.label}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{suggestion.reason}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAddRelative(selectedPerson.id, suggestion.type)}
          >
            Add
          </Button>
        </div>
      ))}
    </div>
  );

  const renderSmartSuggestionsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h4 className="font-semibold">Smart Suggestions</h4>
        <Badge variant="secondary">{smartSuggestions.length}</Badge>
      </div>
      
      {smartSuggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No suggestions available</p>
          <p className="text-xs">Family tree looks complete!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {smartSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-white
                    ${suggestion.priority === 'high' ? 'bg-red-500' : 
                      suggestion.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}
                  `}>
                    <span className="text-lg">{suggestion.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm">{suggestion.label}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {suggestion.description}
                    </p>
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'destructive' : 
                              suggestion.priority === 'medium' ? 'default' : 'secondary'}
                      className="mt-2 text-xs"
                    >
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddRelative(selectedPerson.id, suggestion.type)}
                  className="ml-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAdvancedSection = () => (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center space-x-2">
        <User className="w-5 h-5" />
        <span>Advanced Options</span>
      </h4>
      
      <div className="space-y-3">
        <Card className="p-4">
          <h5 className="font-medium mb-2">Relationship Types</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {['Biological', 'Adopted', 'Step', 'Foster', 'In-law', 'Half'].map((type) => (
              <Badge key={type} variant="outline" className="justify-center">
                {type}
              </Badge>
            ))}
          </div>
        </Card>
        
        <Card className="p-4">
          <h5 className="font-medium mb-2">Bulk Operations</h5>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full">
              Add Complete Family Unit
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              Import from Gedcom
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          إضافة أقارب لـ {selectedPerson.name}
        </h3>
        <Badge variant="outline">{selectedPerson.name.split(' ')[0]}</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
        {[
          { id: 'quick', label: 'إضافة سريعة', icon: <UserPlus size={14} /> },
          { id: 'smart', label: 'ذكي', icon: <Sparkles size={14} /> },
          { id: 'advanced', label: 'متقدم', icon: <User size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'quick' && renderQuickAddSection()}
        {activeTab === 'smart' && renderSmartSuggestionsSection()}
        {activeTab === 'advanced' && renderAdvancedSection()}
      </div>
    </Card>
  );
};