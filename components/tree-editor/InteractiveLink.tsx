import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Trash2,
  Edit3,
  X,
  Heart,
  Users,
  ArrowDown,
  ArrowUp,
  Info
} from 'lucide-react';
import { FamilyMember } from '../../lib/types';

interface InteractiveLinkProps {
  linkData: {
    id: string;
    type: 'ancestry' | 'progeny' | 'spouse';
    person1: FamilyMember;
    person2: FamilyMember;
  };
  position: { x: number; y: number };
  isDarkMode: boolean;
  onModifyRelationship: (
    personId1: string,
    personId2: string,
    action: 'connect' | 'disconnect' | 'modify',
    relationshipType: 'parent' | 'spouse' | 'child' | 'sibling'
  ) => void;
  onClose: () => void;
}

export const InteractiveLink: React.FC<InteractiveLinkProps> = ({
  linkData,
  position,
  isDarkMode,
  onModifyRelationship,
  onClose
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRelationshipInfo = () => {
    const { type, person1, person2 } = linkData;
    
    switch (type) {
      case 'spouse':
        return {
          icon: <Heart className="w-4 h-4" />,
          label: 'Marriage',
          description: `${person1.name} ♥ ${person2.name}`,
          color: 'bg-pink-100 text-pink-800',
          actionType: 'spouse' as const
        };
      case 'ancestry':
        return {
          icon: <ArrowUp className="w-4 h-4" />,
          label: 'Parent-Child',
          description: `${person1.name} → ${person2.name}`,
          color: 'bg-blue-100 text-blue-800',
          actionType: 'parent' as const
        };
      case 'progeny':
        return {
          icon: <ArrowDown className="w-4 h-4" />,
          label: 'Parent-Child',
          description: `${person1.name} → ${person2.name}`,
          color: 'bg-green-100 text-green-800',
          actionType: 'child' as const
        };
      default:
        return {
          icon: <Users className="w-4 h-4" />,
          label: 'Relationship',
          description: `${person1.name} — ${person2.name}`,
          color: 'bg-gray-100 text-gray-800',
          actionType: 'sibling' as const
        };
    }
  };

  const relationshipInfo = getRelationshipInfo();

  const handleDisconnect = () => {
    onModifyRelationship(
      linkData.person1.id,
      linkData.person2.id,
      'disconnect',
      relationshipInfo.actionType
    );
    onClose();
  };

  const handleModify = () => {
    // TODO: Open detailed relationship editor
    setShowDetails(true);
  };

  return (
    <div 
      className="fixed z-50 pointer-events-auto"
      style={{ 
        left: Math.min(position.x - 160, window.innerWidth - 320), 
        top: Math.min(position.y - 50, window.innerHeight - 200),
      }}
    >
      <Card className={`
        w-80 shadow-xl border-2
        ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        border-blue-400
      `}>
        {/* Header */}
        <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-1 rounded ${relationshipInfo.color}`}>
                {relationshipInfo.icon}
              </div>
              <div>
                <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {relationshipInfo.label}
                </span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {linkData.type}
                </Badge>
              </div>
            </div>
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

        {/* Content */}
        <div className="p-3">
          {/* Relationship Description */}
          <div className={`p-3 rounded-lg mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {relationshipInfo.description}
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Click to manage this relationship
            </p>
          </div>

          {/* Person Details */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className={`p-2 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-medium">{linkData.person1.name}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {linkData.person1.birth_year}
                {linkData.person1.death_year && ` - ${linkData.person1.death_year}`}
              </p>
            </div>
            <div className={`p-2 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs font-medium">{linkData.person2.name}</p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {linkData.person2.birth_year}
                {linkData.person2.death_year && ` - ${linkData.person2.death_year}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleModify}
              className="flex-1"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Modify
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
          </div>

          {/* Details Section */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Relationship Details
              </h4>
              
              {linkData.type === 'spouse' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Marriage Status:</span>
                    <Badge variant="secondary">Married</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Shared Children:</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {linkData.person1.children?.filter(childId => 
                        linkData.person2.children?.includes(childId)
                      ).length || 0}
                    </span>
                  </div>
                </div>
              )}
              
              {(linkData.type === 'ancestry' || linkData.type === 'progeny') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Relationship Type:</span>
                    <Badge variant="secondary">Biological</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Age Difference:</span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {Math.abs(linkData.person1.birth_year - linkData.person2.birth_year)} years
                    </span>
                  </div>
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="w-full mt-2"
              >
                Hide Details
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};