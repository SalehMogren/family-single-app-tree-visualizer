import { FamilyMember, SmartSuggestion, RelationshipConnection } from '../types';
import { getParentIds, getChildIds, getSpouseIds, getSiblingIds } from './relationshipHelpers';

export class SmartSuggestionsEngine {
  /**
   * Generate smart suggestions for adding relationships to a person
   */
  static generateSuggestions(
    targetPerson: FamilyMember,
    allData: { [id: string]: FamilyMember },
    relationships: RelationshipConnection[] = []
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Early validation - ensure targetPerson is valid
    if (!targetPerson || !targetPerson.id) {
      console.warn('[SmartSuggestions] Invalid targetPerson provided:', targetPerson);
      return suggestions;
    }
    
    // Ensure allData is valid
    if (!allData || typeof allData !== 'object') {
      console.warn('[SmartSuggestions] Invalid allData provided:', allData);
      return suggestions;
    }
    
    // Analyze current relationships using relationship helpers
    const parentIds = getParentIds(targetPerson.id, relationships);
    const spouseIds = getSpouseIds(targetPerson.id, relationships);
    const childIds = getChildIds(targetPerson.id, relationships);
    const siblingIds = getSiblingIds(targetPerson.id, relationships);
    
    const hasParents = parentIds.length > 0;
    const hasSpouses = spouseIds.length > 0;
    const hasChildren = childIds.length > 0;
    const parentCount = parentIds.length;
    
    // High priority suggestions
    if (parentCount === 0) {
      suggestions.push({
        id: `${targetPerson.id}_add_parents`,
        type: 'parent',
        label: 'Add Parents',
        description: 'Add mother and father to complete family structure',
        priority: 'high',
        reason: 'No parents recorded',
        targetPersonId: targetPerson.id,
        icon: '👨‍👩‍👧‍👦'
      });
    } else if (parentCount === 1) {
      const parentId = parentIds[0];
      const existingParent = allData[parentId];
      
      if (existingParent) {
        const parentSpouseIds = getSpouseIds(parentId, relationships);
        const needsSpouse = parentSpouseIds.length === 0;
        
        if (needsSpouse) {
          suggestions.push({
            id: `${targetPerson.id}_complete_parents`,
            type: 'parent',
            label: `Add ${existingParent.gender === 'male' ? 'Mother' : 'Father'}`,
            description: `Complete the parental relationship for ${existingParent.name || 'parent'}`,
            priority: 'high',
            reason: 'Missing one parent',
            targetPersonId: targetPerson.id,
            icon: existingParent.gender === 'male' ? '👩' : '👨'
          });
        }
      } else {
        console.warn(`[SmartSuggestions] Parent with ID ${parentId} not found in allData`);
      }
    }

    // Spouse suggestions
    if (!hasSpouses) {
      suggestions.push({
        id: `${targetPerson.id}_add_spouse`,
        type: 'spouse',
        label: 'Add Spouse',
        description: 'Add husband/wife to establish marriage relationship',
        priority: 'medium',
        reason: 'No spouse recorded',
        targetPersonId: targetPerson.id,
        icon: targetPerson.gender === 'male' ? '👰' : '🤵'
      });
    }

    // Children suggestions
    if (hasSpouses && !hasChildren) {
      suggestions.push({
        id: `${targetPerson.id}_add_children`,
        type: 'child',
        label: 'Add Children',
        description: 'Add son/daughter to establish family lineage',
        priority: 'medium',
        reason: 'Married couple with no children',
        targetPersonId: targetPerson.id,
        icon: '👶'
      });
    }

    // Sibling suggestions
    if (hasParents) {
      const siblings = this.getSiblings(targetPerson, allData);
      if (siblings.length === 0) {
        suggestions.push({
          id: `${targetPerson.id}_add_sibling`,
          type: 'sibling',
          label: 'Add Sibling',
          description: 'Add brother/sister who shares the same parents',
          priority: 'low',
          reason: 'No siblings recorded',
          targetPersonId: targetPerson.id,
          icon: '👫'
        });
      }
    }

    // Smart connection suggestions
    suggestions.push(...this.generateConnectionSuggestions(targetPerson, allData));

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate suggestions for connecting existing people
   */
  static generateConnectionSuggestions(
    targetPerson: FamilyMember,
    allData: { [id: string]: FamilyMember }
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Early validation
    if (!targetPerson || !targetPerson.id || !allData) {
      console.warn('[SmartSuggestions] Invalid parameters in generateConnectionSuggestions');
      return suggestions;
    }
    
    const allPeople = Object.values(allData).filter(person => person && person.id);

    // Find potential matches based on age, gender, and existing relationships
    for (const person of allPeople) {
      if (!person || person.id === targetPerson.id) continue;

      // Potential spouse suggestions
      if (this.couldBeSpouse(targetPerson, person, allData)) {
        suggestions.push({
          id: `${targetPerson.id}_connect_${person.id}_spouse`,
          type: 'spouse',
          label: `Connect as Spouse: ${person.name}`,
          description: `Establish marriage relationship with ${person.name}`,
          priority: 'medium',
          reason: 'Compatible age and gender for marriage',
          targetPersonId: targetPerson.id,
          suggestedPersonId: person.id,
          icon: '💑'
        });
      }

      // Potential parent suggestions
      if (this.couldBeParent(person, targetPerson, allData)) {
        suggestions.push({
          id: `${targetPerson.id}_connect_${person.id}_parent`,
          type: 'parent',
          label: `Connect as Parent: ${person.name}`,
          description: `Establish parent-child relationship with ${person.name}`,
          priority: 'high',
          reason: 'Compatible age for parent-child relationship',
          targetPersonId: targetPerson.id,
          suggestedPersonId: person.id,
          icon: '👨‍👧'
        });
      }

      // Potential child suggestions
      if (this.couldBeParent(targetPerson, person, allData)) {
        suggestions.push({
          id: `${targetPerson.id}_connect_${person.id}_child`,
          type: 'child',
          label: `Connect as Child: ${person.name}`,
          description: `Establish parent-child relationship with ${person.name}`,
          priority: 'medium',
          reason: 'Compatible age for parent-child relationship',
          targetPersonId: targetPerson.id,
          suggestedPersonId: person.id,
          icon: '👶'
        });
      }
    }

    return suggestions;
  }

  private static getSiblings(person: FamilyMember, allData: { [id: string]: FamilyMember }, relationships: RelationshipConnection[]): FamilyMember[] {
    if (!person || !person.id || !allData || !relationships) return [];
    
    const siblingIds = getSiblingIds(person.id, relationships);
    return siblingIds.map(id => allData[id]).filter(Boolean);
  }

  private static couldBeSpouse(person1: FamilyMember, person2: FamilyMember, allData: { [id: string]: FamilyMember }, relationships: RelationshipConnection[]): boolean {
    // Validate inputs
    if (!person1 || !person2 || !person1.id || !person2.id || !allData || !relationships) return false;
    if (typeof person1.birth_year !== 'number' || typeof person2.birth_year !== 'number') return false;
    
    // Different genders (for traditional marriages)
    if (person1.gender === person2.gender) return false;
    
    // Age compatibility (within reasonable range)
    const ageDiff = Math.abs(person1.birth_year - person2.birth_year);
    if (ageDiff > 20) return false;
    
    // Not already married to each other
    const person1Spouses = getSpouseIds(person1.id, relationships);
    const person2Spouses = getSpouseIds(person2.id, relationships);
    if (person1Spouses.includes(person2.id) || person2Spouses.includes(person1.id)) return false;
    
    // Not closely related
    if (this.areCloselyRelated(person1, person2, allData, relationships)) return false;
    
    return true;
  }

  private static couldBeParent(potentialParent: FamilyMember, potentialChild: FamilyMember, allData: { [id: string]: FamilyMember }, relationships: RelationshipConnection[]): boolean {
    // Validate inputs
    if (!potentialParent || !potentialChild || !potentialParent.id || !potentialChild.id || !allData || !relationships) return false;
    if (typeof potentialParent.birth_year !== 'number' || typeof potentialChild.birth_year !== 'number') return false;
    
    // Age compatibility (parent should be older)
    const ageDiff = potentialParent.birth_year - potentialChild.birth_year;
    if (ageDiff < 15 || ageDiff > 70) return false;
    
    // Not already in parent-child relationship
    const childParents = getParentIds(potentialChild.id, relationships);
    const parentChildren = getChildIds(potentialParent.id, relationships);
    if (childParents.includes(potentialParent.id)) return false;
    if (parentChildren.includes(potentialChild.id)) return false;
    
    // Child doesn't already have 2 parents
    if (childParents.length >= 2) return false;
    
    return true;
  }

  private static areCloselyRelated(person1: FamilyMember, person2: FamilyMember, allData: { [id: string]: FamilyMember }, relationships: RelationshipConnection[]): boolean {
    // Validate inputs
    if (!person1 || !person2 || !person1.id || !person2.id || !allData || !relationships) return false;
    
    // Check if they're parent-child
    const person1Parents = getParentIds(person1.id, relationships);
    const person1Children = getChildIds(person1.id, relationships);
    const person2Parents = getParentIds(person2.id, relationships);
    const person2Children = getChildIds(person2.id, relationships);
    
    if (person1Parents.includes(person2.id) || person2Parents.includes(person1.id)) return true;
    if (person1Children.includes(person2.id) || person2Children.includes(person1.id)) return true;
    
    // Check if they're siblings
    const person1Siblings = getSiblingIds(person1.id, relationships);
    if (person1Siblings.includes(person2.id)) return true;
    
    return false;
  }

  /**
   * Suggest fixes for relationship inconsistencies
   */
  static suggestRelationshipFixes(
    targetPerson: FamilyMember,
    allData: { [id: string]: FamilyMember },
    relationships: RelationshipConnection[] = []
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Early validation
    if (!targetPerson || !targetPerson.id || !allData) {
      console.warn('[SmartSuggestions] Invalid parameters in suggestRelationshipFixes');
      return suggestions;
    }

    // Check for missing reciprocal relationships
    const parentIds = getParentIds(targetPerson.id, relationships);
    for (const parentId of parentIds) {
      if (!parentId) continue;
      const parent = allData[parentId];
      const parentChildren = getChildIds(parentId, relationships);
      if (parent && parent.id && !parentChildren.includes(targetPerson.id)) {
        suggestions.push({
          id: `${targetPerson.id}_fix_parent_${parentId}`,
          type: 'parent',
          label: `Fix Parent Relationship: ${parent.name || 'Unknown'}`,
          description: `Add ${targetPerson.name || 'person'} as child of ${parent.name || 'parent'}`,
          priority: 'high',
          reason: 'Missing reciprocal parent-child relationship',
          targetPersonId: targetPerson.id,
          suggestedPersonId: parentId,
          icon: '🔧'
        });
      }
    }

    // Check for parent spouse connections
    if (parentIds.length === 2) {
      const parent1 = allData[parentIds[0]];
      const parent2 = allData[parentIds[1]];
      
      if (parent1 && parent2) {
        const parent1Spouses = getSpouseIds(parent1.id, relationships);
        const parent2Spouses = getSpouseIds(parent2.id, relationships);
        const areSpouses = parent1Spouses.includes(parent2.id) && parent2Spouses.includes(parent1.id);
        if (!areSpouses) {
          suggestions.push({
            id: `${targetPerson.id}_connect_parents_marriage`,
            type: 'spouse',
            label: `Connect Parents' Marriage: ${parent1.name} & ${parent2.name}`,
            description: `Establish marriage relationship between ${targetPerson.name}'s parents`,
            priority: 'high',
            reason: 'Parents should be married if they have children together',
            targetPersonId: targetPerson.id,
            icon: '💒'
          });
        }
      }
    }

    return suggestions;
  }
}