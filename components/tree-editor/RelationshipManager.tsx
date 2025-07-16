import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisconnectConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  UserPlus,
  Heart,
  Baby,
  Users2,
  User,
  Users,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Edit3,
  Trash2,
  Link,
  Unlink,
  Settings,
  ArrowRightLeft,
  Sparkles,
  Clock,
} from "lucide-react";
import { FamilyMember, SmartSuggestion } from "../../lib/types";
import {
  getExtendedFamily,
  validateRelationship,
  detectDuplicates,
} from "../../lib/utils/CalculateTree";
import {
  getParentIds,
  getSpouseIds,
  getChildIds,
  getSiblingIds,
} from "../../lib/utils/relationshipHelpers";
import { SmartSuggestionsEngine } from "../../lib/utils/SmartSuggestions";
import { useTranslation } from "../../lib/i18n/useTranslation";

interface RelationshipManagerProps {
  selectedPerson: FamilyMember;
  allData: { [id: string]: FamilyMember };
  relationships: any[];
  onAddRelative: (
    nodeId: string,
    type: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  onConnectExisting?: (
    personId1: string,
    personId2: string,
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  onModifyRelationship?: (
    personId1: string,
    personId2: string,
    action: "connect" | "disconnect" | "modify",
    relationshipType: "parent" | "spouse" | "child" | "sibling"
  ) => void;
  isDarkMode: boolean;
}

export const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  selectedPerson,
  allData,
  relationships,
  onAddRelative,
  onConnectExisting,
  onModifyRelationship,
  isDarkMode,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "quick-add" | "suggestions" | "extended" | "validation" | "modify"
  >("quick-add");
  const [editingRelationship, setEditingRelationship] = useState<{
    personId: string;
    type: "parent" | "spouse" | "child" | "sibling";
  } | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    personId: string;
    personName: string;
    relationshipType: "parent" | "spouse" | "child" | "sibling";
  }>({
    open: false,
    personId: "",
    personName: "",
    relationshipType: "parent"
  });

  const parentIds = getParentIds(selectedPerson.id, relationships);
  const spouseIds = getSpouseIds(selectedPerson.id, relationships);
  const childIds = getChildIds(selectedPerson.id, relationships);
  const siblingIds = getSiblingIds(selectedPerson.id, relationships);
  const extendedFamily = getExtendedFamily(
    selectedPerson.id,
    allData,
    relationships
  );

  // Load suggestions when selected person changes
  useEffect(() => {
    const newSuggestions = SmartSuggestionsEngine.generateSuggestions(
      selectedPerson,
      allData
    );
    const fixes = SmartSuggestionsEngine.suggestRelationshipFixes(
      selectedPerson,
      allData
    );
    setSuggestions([...newSuggestions, ...fixes]);
  }, [selectedPerson, allData]);

  const quickAddActions = [
    // Only include Add Parent if less than 2 parents
    ...(parentIds.length < 2
      ? [
          {
            type: "parent" as const,
            label: t('relationships.addParent'),
            icon: <UserPlus size={16} />,
            color: "bg-green-500 hover:bg-green-600",
            disabled: false,
          },
        ]
      : []),
    {
      type: "spouse" as const,
      label: t('relationships.addSpouse'),
      icon: <Heart size={16} />,
      color: "bg-blue-500 hover:bg-blue-600",
      disabled: false,
    },
    {
      type: "child" as const,
      label: t('relationships.addChild'),
      icon: <Baby size={16} />,
      color: "bg-yellow-500 hover:bg-yellow-600",
      disabled: false,
    },
    {
      type: "sibling" as const,
      label: t('relationships.addSibling'),
      icon: <Users2 size={16} />,
      color: "bg-purple-500 hover:bg-purple-600",
      disabled: parentIds.length === 0,
      disabledReason: t('relationships.siblingRequiresParents'),
    },
  ];

  const relationshipCounts = {
    parents: parentIds.length,
    spouses: spouseIds.length,
    children: childIds.length,
    siblings: siblingIds.length,
    grandparents: extendedFamily.grandparents.length,
    auntsUncles: extendedFamily.auntsUncles.length,
    cousins: extendedFamily.cousins.length,
    niecesNephews: extendedFamily.niecesNephews.length,
    inLaws: extendedFamily.inLaws.length,
    stepSiblings: extendedFamily.stepSiblings.length,
  };

  const renderQuickAddSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        {quickAddActions.map((action) => (
          <Button
            key={action.type}
            onClick={() => onAddRelative(selectedPerson.id, action.type)}
            disabled={action.disabled}
            className={`${action.color} text-white transition-all transform hover:scale-105`}
            title={action.disabledReason}>
            <div className='flex items-center gap-2'>
              {action.icon}
              <span className='text-sm'>{action.label}</span>
            </div>
          </Button>
        ))}
      </div>

      <div className='grid grid-cols-2 gap-2 text-xs'>
        <div className='flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded'>
          <span>{t('relationships.parents')}:</span>
          <Badge variant='secondary'>{relationshipCounts.parents}/2</Badge>
        </div>
        <div className='flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded'>
          <span>{t('relationships.spouses')}:</span>
          <Badge variant='secondary'>{relationshipCounts.spouses}</Badge>
        </div>
        <div className='flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded'>
          <span>{t('relationships.children')}:</span>
          <Badge variant='secondary'>{relationshipCounts.children}</Badge>
        </div>
        <div className='flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded'>
          <span>{t('relationships.siblings')}:</span>
          <Badge variant='secondary'>{relationshipCounts.siblings}</Badge>
        </div>
      </div>
    </div>
  );

  const renderExtendedFamilySection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-3'>
        {Object.entries({
          Grandparents: extendedFamily.grandparents,
          "Aunts & Uncles": extendedFamily.auntsUncles,
          Cousins: extendedFamily.cousins,
          "Nieces & Nephews": extendedFamily.niecesNephews,
          "In-Laws": extendedFamily.inLaws,
          "Step-Siblings": extendedFamily.stepSiblings,
        }).map(([label, members]) => (
          <div
            key={label}
            className='p-3 bg-gray-100 dark:bg-gray-700 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-medium text-sm'>{label}</span>
              <Badge variant='outline'>{members.length}</Badge>
            </div>
            {members.length > 0 ? (
              <div className='space-y-1'>
                {members.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className='flex items-center gap-2 text-xs'>
                    <User size={12} />
                    <span>{member.name}</span>
                    <span className='text-gray-500'>({member.birth_year})</span>
                  </div>
                ))}
                {members.length > 3 && (
                  <div className='text-xs text-gray-500'>
                    +{members.length - 3} more...
                  </div>
                )}
              </div>
            ) : (
              <div className='text-xs text-gray-500'>None found</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderValidationSection = () => {
    const validations: Array<{
      type: "error" | "warning" | "success";
      message: string;
      icon: React.ReactNode;
    }> = [];

    // Check for missing parents
    if (parentIds.length === 0) {
      validations.push({
        type: "warning",
        message: "No parents recorded",
        icon: <AlertTriangle size={16} />,
      });
    }

    // Check for age logic
    parentIds.forEach((parentId) => {
      const parent = allData[parentId];
      if (parent) {
        const validation = validateRelationship(
          parent,
          selectedPerson,
          "parent"
        );
        if (!validation.isValid) {
          validations.push({
            type: "error",
            message: `Age issue with ${parent.name}: ${validation.errors[0]}`,
            icon: <AlertTriangle size={16} />,
          });
        }
      }
    });

    // Check for potential duplicates
    const duplicates = detectDuplicates(selectedPerson, allData);
    if (duplicates.length > 0) {
      validations.push({
        type: "warning",
        message: `Potential duplicate: ${duplicates[0].name} (${duplicates[0].birth_year})`,
        icon: <Info size={16} />,
      });
    }

    // All good
    if (validations.length === 0) {
      validations.push({
        type: "success",
        message: "All relationships look good!",
        icon: <CheckCircle size={16} />,
      });
    }

    return (
      <div className='space-y-3'>
        {validations.map((validation, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 rounded-lg ${
              validation.type === "error"
                ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                : validation.type === "warning"
                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
            }`}>
            {validation.icon}
            <span className='text-sm'>{validation.message}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderModifySection = () => {
    const currentRelationships = {
      parents: parentIds.map((id) => allData[id]).filter(Boolean),
      spouses: spouseIds.map((id) => allData[id]).filter(Boolean),
      children: childIds.map((id) => allData[id]).filter(Boolean),
      siblings: siblingIds.map((id) => allData[id]).filter(Boolean),
    };

    return (
      <div className='space-y-4'>
        <div className='flex items-center space-x-2 mb-4'>
          <Settings className='w-5 h-5 text-blue-500' />
          <h4 className='font-semibold'>Modify Relationships</h4>
        </div>

        {Object.entries(currentRelationships).map(
          ([relationshipType, people]) => (
            <Card key={relationshipType} className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <h5 className='font-medium capitalize'>{relationshipType}</h5>
                <Badge variant='outline'>{people.length}</Badge>
              </div>

              {people.length === 0 ? (
                <div className='text-center py-4 text-gray-500 text-sm'>
                  No {relationshipType} recorded
                </div>
              ) : (
                <div className='space-y-2'>
                  {people.map((person) => (
                    <div
                      key={person.id}
                      className='flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded'>
                      <div className='flex items-center space-x-2'>
                        <User size={16} className='text-gray-500' />
                        <div>
                          <span className='font-medium text-sm'>
                            {person.name}
                          </span>
                          <span className='text-xs text-gray-500 ml-2'>
                            ({person.birth_year})
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() =>
                            setEditingRelationship({
                              personId: person.id,
                              type: relationshipType as any,
                            })
                          }
                          className='h-6 w-6 p-0'>
                          <Edit3 size={12} />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            setDisconnectDialog({
                              open: true,
                              personId: person.id,
                              personName: person.name,
                              relationshipType: relationshipType as any
                            });
                          }}
                          className='h-6 w-6 p-0 text-red-500 hover:text-red-700'
                          title={`Remove ${relationshipType.slice(
                            0,
                            -1
                          )} relationship`}>
                          <Unlink size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  onAddRelative(selectedPerson.id, relationshipType as any)
                }
                className='w-full mt-3'>
                <UserPlus size={14} className='mr-1' />
                Add {relationshipType.slice(0, -1)}
              </Button>
            </Card>
          )
        )}

        {/* Enhanced Relationship Connection Tool */}
        <Card className='p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'>
          <div className='flex items-center space-x-2 mb-3'>
            <ArrowRightLeft size={18} className='text-blue-600' />
            <h5 className='font-semibold text-blue-800 dark:text-blue-300'>
              ربط الأشخاص الموجودين
            </h5>
          </div>
          <div className='space-y-3'>
            <div className='text-sm text-blue-700 dark:text-blue-300 leading-relaxed'>
              <p className='mb-2'>يمكنك ربط الأشخاص الموجودين بطرق مختلفة:</p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                <li>استخدم السحب والإفلات بين العقد</li>
                <li>تحقق من علامة التبويب "اقتراحات" للروابط الذكية</li>
                <li>استخدم الأزرار أدناه للربط اليدوي</li>
              </ul>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <Button
                size='sm'
                variant='default'
                className='bg-blue-600 hover:bg-blue-700'
                onClick={() => setActiveTab("suggestions")}
                title='عرض الاقتراحات الذكية للربط'>
                <Sparkles size={14} className='mr-1' />
                عرض الاقتراحات
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='border-blue-300 text-blue-700 hover:bg-blue-100'
                onClick={() => {
                  if (onConnectExisting) {
                    alert(
                      'ملاحظة: استخدم السحب والإفلات أو علامة التبويب "اقتراحات" لربط الأشخاص. سيتم إضافة واجهة ربط أكثر تفصيلاً قريباً.'
                    );
                  } else {
                    console.warn("onConnectExisting callback not provided");
                  }
                }}
                disabled={!onConnectExisting}
                title='ربط يدوي للأشخاص'>
                <Link size={14} className='mr-1' />
                ربط يدوي
              </Button>
            </div>

            {/* Connection Instructions */}
            <div className='bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700'>
              <h6 className='font-medium text-xs text-blue-800 dark:text-blue-300 mb-2'>
                كيفية الاستخدام:
              </h6>
              <div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
                <p>• اسحب من شخص إلى آخر لإنشاء علاقة</p>
                <p>• انقر على "عرض الاقتراحات" للحصول على اقتراحات ذكية</p>
                <p>• استخدم علامة التبويب "تعديل" لإدارة العلاقات الحالية</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderSuggestionsSection = () => {
    const filteredSuggestions = suggestions.filter(
      (suggestion) =>
        activeCategory === "all" || suggestion.priority === activeCategory
    );

    const getPriorityIcon = (priority: "high" | "medium" | "low") => {
      switch (priority) {
        case "high":
          return <AlertTriangle className='w-3 h-3 text-red-500' />;
        case "medium":
          return <Clock className='w-3 h-3 text-yellow-500' />;
        case "low":
          return <CheckCircle className='w-3 h-3 text-green-500' />;
      }
    };

    const getRelationshipIcon = (
      type: "parent" | "spouse" | "child" | "sibling"
    ) => {
      switch (type) {
        case "parent":
          return <UserPlus className='w-3 h-3' />;
        case "spouse":
          return <Heart className='w-3 h-3' />;
        case "child":
          return <Baby className='w-3 h-3' />;
        case "sibling":
          return <Users2 className='w-3 h-3' />;
      }
    };

    const handleSuggestionAction = (suggestion: SmartSuggestion) => {
      if (suggestion.suggestedPersonId && onConnectExisting) {
        onConnectExisting(
          suggestion.targetPersonId,
          suggestion.suggestedPersonId,
          suggestion.type
        );
      } else {
        onAddRelative(suggestion.targetPersonId, suggestion.type);
      }
    };

    const suggestionCounts = {
      all: suggestions.length,
      high: suggestions.filter((s) => s.priority === "high").length,
      medium: suggestions.filter((s) => s.priority === "medium").length,
      low: suggestions.filter((s) => s.priority === "low").length,
    };

    return (
      <div className='space-y-3'>
        <div className='flex items-center space-x-2 mb-3'>
          <Sparkles className='w-4 h-4 text-yellow-500' />
          <h4 className='font-semibold text-sm'>Smart Suggestions</h4>
        </div>

        {/* Compact Category Filter */}
        <div className='flex space-x-1 p-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>
          {(["all", "high", "medium", "low"] as const).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
                activeCategory === category
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}>
              {category !== "all" && getPriorityIcon(category)}
              <span className='capitalize'>{category}</span>
              <Badge variant='secondary' className='ml-1 text-xs h-3 px-1'>
                {suggestionCounts[category]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Compact Suggestions List */}
        <div className='space-y-2 max-h-48 overflow-y-auto'>
          {filteredSuggestions.length === 0 ? (
            <div className='text-center py-4 text-gray-500 text-xs'>
              <Sparkles className='w-6 h-6 mx-auto mb-2 opacity-50' />
              <p>No suggestions for this category</p>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-2 rounded border hover:shadow-sm transition-all ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2 flex-1 min-w-0'>
                    <div className='flex items-center space-x-1'>
                      {getPriorityIcon(suggestion.priority)}
                      <div
                        className={`p-1 rounded ${
                          suggestion.type === "parent"
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20"
                            : suggestion.type === "spouse"
                            ? "bg-pink-100 text-pink-600 dark:bg-pink-900/20"
                            : suggestion.type === "child"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                            : "bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                        }`}>
                        {getRelationshipIcon(suggestion.type)}
                      </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-xs truncate'>
                        {suggestion.label}
                      </p>
                      <p className='text-xs text-gray-500 truncate'>
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    variant={
                      suggestion.priority === "high" ? "default" : "outline"
                    }
                    onClick={() => handleSuggestionAction(suggestion)}
                    className='ml-2 h-6 px-2 text-xs'>
                    {suggestion.suggestedPersonId ? (
                      <>
                        <Link className='w-3 h-3 mr-1' />
                        Connect
                      </>
                    ) : (
                      <>
                        <UserPlus className='w-3 h-3 mr-1' />
                        Add
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing Person Info */}
                {suggestion.suggestedPersonId && (
                  <div
                    className={`mt-2 p-1 rounded text-xs border-l-2 ${
                      suggestion.type === "parent"
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                        : suggestion.type === "spouse"
                        ? "border-pink-400 bg-pink-50 dark:bg-pink-900/20"
                        : suggestion.type === "child"
                        ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                        : "border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                    }`}>
                    <p className='font-medium'>
                      {allData[suggestion.suggestedPersonId]?.name}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Summary */}
        {suggestions.length > 0 && (
          <div className='text-xs text-gray-500 flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600'>
            <span>{suggestions.length} total</span>
            <span>
              {suggestions.filter((s) => s.priority === "high").length} high
              priority
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleDisconnectConfirm = () => {
    if (onModifyRelationship) {
      onModifyRelationship(
        selectedPerson.id,
        disconnectDialog.personId,
        "disconnect",
        disconnectDialog.relationshipType
      );
    } else {
      console.warn("onModifyRelationship callback not provided");
    }
    setDisconnectDialog(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Card
        className={`p-4 ${
          isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50"
        }`}>
      <div className='flex items-center justify-between mb-4'>
        <h3
          className={`font-semibold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
          Relationship Manager
        </h3>
        <Badge variant='outline'>{selectedPerson.name}</Badge>
      </div>

      {/* Tab Navigation */}
      <div className='flex space-x-1 mb-4 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg'>
        {[
          { id: "quick-add", label: "Quick Add", icon: <UserPlus size={14} /> },
          {
            id: "suggestions",
            label: "Suggestions",
            icon: <Sparkles size={14} />,
          },
          { id: "extended", label: "Extended", icon: <Users size={14} /> },
          { id: "modify", label: "Modify", icon: <Settings size={14} /> },
          {
            id: "validation",
            label: "Validation",
            icon: <CheckCircle size={14} />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className='min-h-[200px]'>
        {activeTab === "quick-add" && renderQuickAddSection()}
        {activeTab === "suggestions" && renderSuggestionsSection()}
        {activeTab === "extended" && renderExtendedFamilySection()}
        {activeTab === "modify" && renderModifySection()}
        {activeTab === "validation" && renderValidationSection()}
      </div>
      </Card>

      <DisconnectConfirmationDialog
        open={disconnectDialog.open}
        onOpenChange={(open) => setDisconnectDialog(prev => ({ ...prev, open }))}
        description={`Are you sure you want to disconnect the ${disconnectDialog.relationshipType} relationship between ${selectedPerson.name} and ${disconnectDialog.personName}? This action cannot be undone.`}
        onConfirm={handleDisconnectConfirm}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
