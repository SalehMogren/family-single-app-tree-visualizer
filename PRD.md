# Product Requirements Document (PRD)
## Family Tree Visualizer Application

### 1. Product Overview

**Product Name:** Family Tree Visualizer (شجرة العائلة)  
**Version:** 1.0.0  
**Platform:** Web Application (Next.js 14)  
**Repository:** family-single-app-tree-visualizer

#### What is this product?
A web application that lets users create and view family trees. Users can add family members, connect them with relationships (parent, child, spouse), and see their family structure in a visual tree format.

#### Main Features
- **Family Tree Management**: Complete CRUD operations with visual tree editor
- **History & Version Control**: Track changes with undo/redo functionality
- **Smart Tree Building**: Intelligent suggestions for missing family connections
- **Family Wiki**: Publish family stories, timelines, and historical content
- **Member Profiles**: Detailed information and photo galleries for each member
- **Communication Hub**: Family-wide messaging and announcement features
- **Admin Controls**: User management, privacy settings, and content moderation
- **Data Portability**: Export/import family data in JSON format
- **Arabic Language Support**: Full RTL interface for Arabic-speaking families

---

### 2. Who Will Use This?

**Target Users:**
- **Family Administrators**: Manage the family tree and control access
- **Family Historians**: Document and preserve family heritage
- **Active Family Members**: Share stories and stay connected
- **Extended Family**: View family connections and participate in discussions

**User Roles:**
- **Admin**: Full control over app, users, and content
- **Editor**: Can modify tree and publish content
- **Viewer**: Can view tree and content, participate in chat
- **Guest**: Limited view access (configurable by admin)

**What they'll do:**
- Build and maintain comprehensive family trees
- Share family stories, photos, and memories
- Communicate through announcements and chat
- Collaborate on family history documentation
- Plan family events and stay connected

---

### 3. Core Features

#### 3.1 Family Tree Management
- **Visual Tree Editor**: 
  - Add/edit/delete family members directly from tree visualization
  - Interactive node cards with "+" buttons for adding relatives
  - In-context forms that appear within the tree view
  - Real-time tree layout updates
- **Multiple View Modes**:
  - Full tree view: Complete family visualization
  - Focus mode: 3-level view centered on selected person
- **Navigation Controls**:
  - Zoom in/out with smooth animations
  - Pan across large family trees
  - Search and jump to specific members

#### 3.2 Member Profiles & Information
- **Comprehensive Member Data**:
  - Basic info: Name, gender, birth/death years
  - Extended info: Occupation, birthplace, biography
  - Photo galleries with multiple images per person
  - Document attachments (certificates, letters)
- **Relationship Tracking**:
  - Parents, children, spouses, siblings
  - Relationship dates and notes
  - Multiple marriages support

#### 3.3 Family Wiki & Content Platform
- **Story Publishing**:
  - Create posts about family history
  - Share family stories and memories
  - Add photos and media to posts
  - Category/tag system for organization
- **Timeline Feature**:
  - Chronological view of family events
  - Historical milestones and celebrations
  - Integration with member life events
- **Content Types**:
  - Text posts with rich formatting
  - Photo albums and galleries
  - Family announcements
  - Historical documents

#### 3.4 Communication Hub
- **Announcement System**:
  - Family-wide announcements
  - Important date reminders
  - Event notifications
- **Chat Features**:
  - Family group chat
  - Direct messaging between members
  - Message history and search
- **External Integration** (Planned):
  - WhatsApp integration for notifications
  - Social media sharing capabilities
  - Email notifications for important updates

#### 3.5 Smart Tree Building Assistant
- **Relationship Suggestions**:
  - Identify missing parents or spouses
  - Suggest potential connections based on data patterns
  - Highlight incomplete family groups
- **Data Validation**:
  - Check for logical inconsistencies
  - Verify relationship compatibility
  - Alert for potential duplicates

#### 3.6 Version Control & History
- **Change Tracking**:
  - 50-level undo/redo functionality
  - Change history log with timestamps
  - See who made what changes
- **Data Recovery**:
  - Restore previous versions
  - Recover deleted members
  - Audit trail for all modifications

#### 3.7 Admin Control Panel
- **User Management**:
  - Add/remove family members from app
  - Assign roles and permissions
  - Approve new member registrations
  - Monitor user activity
- **Privacy Controls**:
  - Make entire app private or public
  - Control which sections are visible
  - Set content visibility rules
  - Manage external sharing permissions
- **Content Moderation**:
  - Review and manage posted content
  - Set content guidelines
  - Remove inappropriate material
  - Feature/unfeature important posts
- **Role-Based Access Control (RBAC)**:
  - Default roles: Admin, Editor, Viewer, Guest
  - Custom role creation
  - Granular permission settings
  - Role assignment interface

#### 3.8 Data Management
- **Import/Export**:
  - JSON format for data portability
  - GEDCOM support (future)
  - Bulk import capabilities
- **Backup & Restore**:
  - Automated backups
  - Manual backup triggers
  - Point-in-time recovery

---

### 4. Technical Architecture

#### 4.1 System Architecture
**Frontend:**
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **State Management**: Redux Toolkit (local), API state management
- **Tree Visualization**: D3.js
- **Styling**: Tailwind CSS, Shadcn/ui
- **Real-time**: Socket.io or similar for chat/notifications

**Backend (Required):**
- **API**: RESTful API (consider GraphQL for complex queries)
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: RBAC with permission middleware
- **Database**: NoSQL (MongoDB) or Vector DB for flexible schema
- **File Storage**: Cloud storage for images/documents (S3, Cloudinary)
- **Notification Service**: Integration with push notification services

**Infrastructure:**
- **Deployment**: Support both SaaS and self-hosted options
- **Scalability**: Microservices-ready architecture
- **Caching**: Redis for performance
- **Message Queue**: For async operations (notifications, emails)

#### 4.2 Security & Privacy
- **Data Encryption**: At rest and in transit
- **User Authentication**: Multi-factor authentication support
- **Session Management**: Secure session handling
- **API Security**: Rate limiting, input validation
- **Privacy Compliance**: GDPR considerations

#### 4.3 Database Design Considerations
**Collections/Tables Needed:**
- Users (authentication, profiles, roles)
- FamilyMembers (tree data, relationships)
- Posts (wiki content, stories)
- Media (images, documents)
- Messages (chat, announcements)
- Permissions (RBAC rules)
- ActivityLogs (audit trail)

**Key Design Decisions:**
- Flexible schema for family member data
- Efficient relationship queries
- Full-text search for content
- Optimized for tree traversal operations

---

### 5. How Features Work

#### 5.1 Adding a Family Member
**Standard Flow:**
1. User clicks on a person in the tree
2. User clicks the "+" button for the type of relative (parent/child/spouse)
3. A form appears right in the tree view
4. User fills in the new person's details
5. New person appears connected in the tree immediately

**Edge Cases & Validation:**
- **Parent Addition**: Only show "Add Parent" if person has fewer than 2 parents
- **Child Addition**: Always available (no limit on children)
- **Spouse Addition**: Always available (supports multiple marriages)
- **Duplicate Prevention**: Check for existing person with same name/birth details
- **Circular Reference Prevention**: Prevent adding someone as their own parent/child

#### 5.2 Creating Relationships
**Direct from Tree Nodes:**
- Each person card shows "+" buttons
- Click "Add Parent" to add a parent
- Click "Add Child" to add a child  
- Click "Add Spouse" to add a spouse
- Forms appear in context, keeping you in the tree view

**Relationship Validation Rules:**
- **Parent Limits**: Maximum 2 parents per person (biological/adoptive)
- **Age Logic**: Parent must be born before child (with reasonable buffer)
- **Marriage Logic**: Spouses should have overlapping life spans
- **Sibling Logic**: Siblings must share at least one parent
- **Self-Reference**: Person cannot be their own parent/child/spouse

**Key Point:** All additions happen through the tree visualization itself - no separate forms or pages

#### 5.3 Editing Relationships
**Parent Relationship Editing:**
- **Change Parent**: Allow reassigning a person's parent to a different person
- **Remove Parent**: Remove one parent while keeping the other
- **Add Second Parent**: Add second parent if only one exists
- **Validation**: Ensure new parent makes logical sense (age, existing relationships)

**Spouse Relationship Editing:**
- **Change Spouse**: Reassign spouse to different person
- **Remove Spouse**: Remove spouse relationship
- **Add Additional Spouse**: Support multiple marriages
- **Marriage Dates**: Track marriage start/end dates

**Child Relationship Editing:**
- **Reassign Child**: Move child to different parent(s)
- **Remove Child**: Remove parent-child relationship
- **Validation**: Ensure child still has at least one parent after changes

#### 5.4 Removing Family Members
**Deletion Rules:**
- **Orphan Prevention**: Cannot delete person if they have dependent children
- **Relationship Cleanup**: Remove all relationships when person is deleted
- **Cascade Options**: Choose whether to delete children when parent is deleted
- **Soft Delete**: Mark as deceased rather than deleting (configurable)

**Removal Validation:**
- **Confirmation Dialog**: Require confirmation for deletions
- **Impact Warning**: Show what relationships will be affected
- **Undo Capability**: Ensure deletion can be undone

#### 5.5 Viewing the Tree
- **Pan**: Click and drag the background
- **Zoom**: Use mouse wheel or zoom buttons
- **Focus**: Click a person to center on them
- **Switch views**: Toggle between full tree and 3-level view

#### 5.6 Suggestions System
The app checks for:
- People with no parents
- People with children but no spouse
- Incomplete family groups

Suggestions appear as:
- Yellow badges on people cards
- List in the sidebar
- Tooltips explaining what's missing

---

### 6. Edge Cases & Validation Rules

#### 6.1 Parent Relationship Edge Cases
**Implementation Requirements:**
```typescript
// Example validation logic
const canAddParent = (person: FamilyMember, newParent: FamilyMember): boolean => {
  // Check if person already has 2 parents
  if (person.parents.length >= 2) return false;
  
  // Check for circular reference
  if (isDescendant(newParent, person)) return false;
  
  // Check age logic (parent must be older)
  if (newParent.birthYear >= person.birthYear) return false;
  
  return true;
};
```

**Edge Cases to Handle:**
- **Maximum Parents**: Hide "Add Parent" button when person has 2 parents
- **Age Validation**: Parent must be born before child (minimum 13 years difference)
- **Circular References**: Prevent adding ancestor as descendant
- **Existing Parent**: Prevent adding same parent twice
- **Sibling Consistency**: Ensure siblings share at least one parent

#### 6.2 Spouse Relationship Edge Cases
**Implementation Requirements:**
```typescript
const canAddSpouse = (person: FamilyMember, newSpouse: FamilyMember): boolean => {
  // Check for self-marriage
  if (person.id === newSpouse.id) return false;
  
  // Check for existing spouse (if monogamous setting enabled)
  if (settings.monogamous && person.spouses.length > 0) return false;
  
  // Check age overlap (both must be alive during marriage)
  if (!lifespansOverlap(person, newSpouse)) return false;
  
  return true;
};
```

**Edge Cases to Handle:**
- **Self-Marriage**: Prevent person from marrying themselves
- **Age Overlap**: Spouses must have overlapping life spans
- **Multiple Marriages**: Support multiple spouses with dates
- **Same-Sex Marriage**: Configurable support for same-sex relationships
- **Marriage Dates**: Validate marriage dates against birth/death dates

#### 6.3 Child Relationship Edge Cases
**Implementation Requirements:**
```typescript
const canAddChild = (parent: FamilyMember, newChild: FamilyMember): boolean => {
  // Check age logic
  if (parent.birthYear >= newChild.birthYear) return false;
  
  // Check for circular reference
  if (isAncestor(newChild, parent)) return false;
  
  // Check if child already has this parent
  if (newChild.parents.includes(parent.id)) return false;
  
  return true;
};
```

**Edge Cases to Handle:**
- **Age Logic**: Child must be born after parent (minimum 13 years difference)
- **Circular References**: Prevent adding descendant as ancestor
- **Duplicate Parents**: Prevent adding same parent twice
- **Orphan Prevention**: Ensure child always has at least one parent
- **Sibling Validation**: Update sibling relationships when adding child

#### 6.4 Deletion Edge Cases
**Implementation Requirements:**
```typescript
const canDeletePerson = (person: FamilyMember): { canDelete: boolean, warnings: string[] } => {
  const warnings: string[] = [];
  
  // Check for dependent children
  if (person.children.length > 0) {
    warnings.push(`Cannot delete: ${person.children.length} dependent children`);
  }
  
  // Check for living spouse
  if (person.spouses.some(s => s.isAlive)) {
    warnings.push("Has living spouse");
  }
  
  // Check for living parents
  if (person.parents.some(p => p.isAlive)) {
    warnings.push("Has living parents");
  }
  
  return {
    canDelete: warnings.length === 0,
    warnings
  };
};
```

**Edge Cases to Handle:**
- **Dependent Children**: Prevent deletion if person has children
- **Cascade Options**: Choose whether to delete children with parent
- **Relationship Cleanup**: Remove all relationships when person deleted
- **Soft Delete**: Option to mark as deceased instead of deleting
- **Undo Capability**: Ensure deletion can be undone within undo history

#### 6.5 UI State Management Edge Cases
**Button Visibility Rules:**
```typescript
const getVisibleButtons = (person: FamilyMember): AddButton[] => {
  const buttons: AddButton[] = [];
  
  // Always show Add Child
  buttons.push({ type: 'child', label: 'Add Child' });
  
  // Show Add Parent only if less than 2 parents
  if (person.parents.length < 2) {
    buttons.push({ type: 'parent', label: 'Add Parent' });
  }
  
  // Always show Add Spouse
  buttons.push({ type: 'spouse', label: 'Add Spouse' });
  
  return buttons;
};
```

**Form State Management:**
- **Dynamic Form Fields**: Show/hide fields based on relationship type
- **Validation Feedback**: Real-time validation with error messages
- **Loading States**: Show loading indicators during operations
- **Error Recovery**: Graceful handling of failed operations

---

### 7. User Interface Design

#### 7.1 Layout
```
+------------------+------------------------+------------------+
|                  |                        |                  |
|   Left Panel     |    Center (Tree)       |   Right Panel    |
|                  |                        |                  |
| - Controls       |  - Interactive tree    | - Person info    |
| - Statistics     |  - Zoom/pan controls   | - Relationships  |
| - Suggestions    |  - Node cards          | - Edit forms     |
|                  |                        |                  |
+------------------+------------------------+------------------+
```

#### 7.2 Important UI Elements
- **Node Cards**: Show person's name, years, and "+" buttons for adding relatives
- **Add Buttons**: Integrated "+" buttons on each person for adding parents, children, or spouses
- **In-tree Forms**: Forms that appear within the tree view when adding/editing
- **Connection Lines**: Different styles for parent/child vs spouse relationships
- **Toolbar**: Undo, redo, export, view controls

#### 7.3 Arabic Support
- Text displays right-to-left
- UI mirrors for Arabic layout
- Proper Arabic fonts and spacing

---

### 8. Configuration

The app uses JSON config files in `public/config/`:

**app-config.json** controls:
- App title and description
- Which features are enabled
- Default tree settings
- UI preferences

Example:
```json
{
  "features": {
    "familyHistory": true,    // Show family history panel
    "exportTree": true,       // Allow JSON export
    "darkMode": true          // Enable dark theme
  },
  "validation": {
    "maxParents": 2,          // Maximum parents per person
    "minAgeDifference": 13,   // Minimum age difference for parent-child
    "allowMultipleSpouses": true, // Allow multiple marriages
    "softDelete": true        // Mark as deceased instead of deleting
  }
}
```

---

### 9. Development Guidelines

#### 9.1 Code Style
- Use TypeScript with strict mode
- Functional components with hooks
- Descriptive variable names
- Handle all edge cases

#### 9.2 Component Pattern
```typescript
// Example component structure
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // State hooks
  const [state, setState] = useState();
  
  // Event handlers start with "handle"
  const handleClick = () => {
    // Logic here
  };
  
  // Early returns for edge cases
  if (!data) return null;
  
  // Main render
  return (
    <div className="tailwind-classes">
      {/* Content */}
    </div>
  );
};
```

#### 9.3 Common Tasks

**Adding a new feature:**
1. Create component in appropriate folder
2. Add Redux actions if needed
3. Update types in `types.ts`
4. Test with sample data

**Modifying tree layout:**
1. Edit `CalculateTree.ts`
2. Test with various tree sizes
3. Check performance with large trees

---

### 10. Testing Checklist

#### 10.1 Core Functionality Testing
**Family Member Management:**
- [ ] Add new family member with all required fields
- [ ] Edit existing family member information
- [ ] Delete family member (with proper validation)
- [ ] Soft delete (mark as deceased) functionality
- [ ] Undo/redo for all member operations

**Relationship Management:**
- [ ] Add parent relationship (respecting 2-parent limit)
- [ ] Add child relationship (no limit)
- [ ] Add spouse relationship (supporting multiple marriages)
- [ ] Edit existing relationships (change parent, spouse, etc.)
- [ ] Remove relationships with proper cleanup
- [ ] Validate age logic for all relationships
- [ ] Prevent circular references in relationships

#### 10.2 Edge Case Testing
**Parent Relationship Edge Cases:**
- [ ] Hide "Add Parent" button when person has 2 parents
- [ ] Prevent adding parent younger than child
- [ ] Prevent adding same parent twice
- [ ] Prevent circular references (parent as child)
- [ ] Handle orphaned children when parent is deleted
- [ ] Validate sibling relationships when parent changes

**Spouse Relationship Edge Cases:**
- [ ] Prevent self-marriage
- [ ] Validate marriage dates against life spans
- [ ] Support multiple marriages with dates
- [ ] Handle divorce/remarriage scenarios
- [ ] Prevent marriage between close relatives (configurable)

**Child Relationship Edge Cases:**
- [ ] Prevent adding child older than parent
- [ ] Prevent circular references (child as parent)
- [ ] Maintain sibling relationships when adding children
- [ ] Handle adoption scenarios
- [ ] Validate family tree integrity after changes

**Deletion Edge Cases:**
- [ ] Prevent deletion of person with dependent children
- [ ] Show proper warnings before deletion
- [ ] Clean up all relationships when person is deleted
- [ ] Support cascade deletion with confirmation
- [ ] Ensure deletion can be undone
- [ ] Handle soft delete vs hard delete options

#### 10.3 UI/UX Testing
**Button Visibility & State:**
- [ ] Add buttons only show when appropriate
- [ ] Buttons are disabled when operations are invalid
- [ ] Loading states during operations
- [ ] Error states with clear messages
- [ ] Success feedback for completed operations

**Form Validation:**
- [ ] Real-time validation feedback
- [ ] Required field validation
- [ ] Date range validation
- [ ] Relationship logic validation
- [ ] Duplicate detection

**Tree Navigation:**
- [ ] Zoom in/out functionality
- [ ] Pan across large trees
- [ ] Focus on specific person
- [ ] Search and jump to person
- [ ] Switch between view modes

#### 10.4 Cross-Browser & Responsive Testing
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Mobile responsive design
- [ ] Touch interactions on mobile
- [ ] Arabic text displays properly (RTL)
- [ ] Accessibility features work (screen readers, keyboard navigation)

#### 10.5 Performance Testing
- [ ] Tree loads in under 3 seconds
- [ ] Smooth animations (60 FPS)
- [ ] Handles trees with 1000+ members
- [ ] Memory usage stays reasonable
- [ ] Undo history doesn't cause performance issues

#### 10.6 Data Integrity Testing
- [ ] Export/import functionality preserves all data
- [ ] JSON format is valid and complete
- [ ] Relationship integrity maintained after import
- [ ] No data corruption during operations
- [ ] Backup/restore functionality works

---

### 11. Performance Guidelines

**Keep the app fast:**
- Trees should load in under 3 seconds
- Smooth animations (60 FPS)
- Support up to 1000 family members
- Optimize images before uploading

**Memory management:**
- Don't load all images at once
- Clean up event listeners
- Limit undo history to 50 steps

---

### 12. Development Phases & Priorities

#### Phase 1: Core Tree Functionality (Current)
**High Priority:**
- Family tree visualization and navigation
- Basic CRUD operations for members
- Tree editor with visual controls
- Export/import functionality
- Basic member profiles

**Status:** In Development

#### Phase 2: Backend & Authentication
**High Priority:**
- User authentication system
- Database integration
- API development
- Basic role management (Admin, Editor, Viewer)
- Data persistence

**Timeline:** Next major milestone

#### Phase 3: Family Wiki & Content
**Medium Priority:**
- Post creation and management
- Story publishing system
- Timeline feature
- Category/tag organization
- Basic content moderation

#### Phase 4: Communication Features
**Medium Priority:**
- Announcement system
- Family chat functionality
- Notification infrastructure
- WhatsApp integration planning

#### Phase 5: Advanced Features
**Low Priority:**
- GEDCOM import/export
- Advanced RBAC customization
- Calendar integration
- Multi-language support
- Mobile app consideration

### 13. Integration Points

#### Planned Integrations:
1. **Communication Platforms**
   - WhatsApp API for notifications
   - Email service (SendGrid/AWS SES)
   - Social media sharing APIs

2. **Storage & Media**
   - Cloudinary for image optimization
   - S3-compatible storage for documents
   - CDN for global content delivery

3. **Future Genealogy Services**
   - Ancestry.com API
   - MyHeritage integration
   - FamilySearch compatibility

4. **Calendar Services**
   - Google Calendar
   - Outlook Calendar
   - Apple Calendar

### 14. Success Metrics

**User Engagement:**
- Active family members per month
- Posts/stories created
- Tree completeness percentage
- User retention rate

**Technical Performance:**
- API response times < 200ms
- Page load times < 2 seconds
- 99.9% uptime
- Successful authentication rate

**Content Metrics:**
- Stories published per family
- Photos uploaded per member
- Chat messages sent
- Announcement engagement rate

---

**Document Version:** 1.1  
**Last Updated:** July 2025  

This PRD provides comprehensive guidance for LLMs and AI IDE Editors working on the Family Tree Visualizer. Each section includes specific implementation details, edge cases, and validation rules to ensure robust development. Focus on one feature at a time, test thoroughly using the detailed checklist, and refer to the edge cases section for comprehensive validation scenarios.