# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Start production**: `npm start`
- **Lint**: `npm run lint`
- **Package manager**: npm (package-lock.json exists) or pnpm (pnpm-lock.yaml exists)

## Project Architecture

This is a Next.js 14 family tree visualization application built with TypeScript, React, Redux Toolkit, Zustand, and D3.js. The app allows users to create, edit, and visualize complex family relationships with an interactive tree editor.

### Core State Management

- **Redux Store** (`lib/store/`): Centralized state management for family tree data
  - `treeSlice.ts`: Main slice managing tree state, data, layout, and undo/redo history
  - `useTreeStore.ts`: Custom hook providing simplified Redux interface
- **Types** (`lib/types.ts`): Comprehensive TypeScript definitions for family members, tree nodes, relationships, and editor state

### Key Components Architecture

1. **Tree Visualization System**:
   - `BaseTree.tsx`: Reusable D3-based tree renderer with zoom/pan, node interaction
   - `NodeCard.tsx`: Individual family member display cards with relationship controls
   - `TreeSvg.tsx`: SVG-specific tree implementation for tree editor

2. **Tree Editor System** (`components/tree-editor/`):
   - **Interactive Components**: AddOrEditNodeForm, RelationshipManager, InteractiveLink
   - **Drag & Drop**: DragDropProvider for relationship creation via dragging
   - **Smart Features**: SmartSuggestions engine, FloatingSuggestions UI
   - **Add Relatives**: EnhancedAddRelativeUI, SuggestedRelatives for guided relationship creation

3. **Configuration-Driven Design**:
   - JSON config files in `public/config/` control features, themes, and content
   - `useAppConfig()`, `useConfig()` hooks load configurations dynamically
   - Feature toggles enable/disable functionality without code changes

### Data Flow

1. **Family Data**: Stored in Redux as `{ [id: string]: FamilyMember }`
2. **Tree Calculation**: `CalculateTree.ts` transforms family data into positioned nodes
3. **Rendering**: D3.js handles SVG positioning, zoom, and pan
4. **State Updates**: All modifications go through Redux actions with undo/redo support

### Layout & Styling

- **Tailwind CSS**: Primary styling system
- **Shadcn/ui**: Component library for buttons, cards, inputs
- **RTL Support**: Full Arabic language support
- **Responsive**: Mobile-first design with dynamic layouts

### File Structure Patterns

- `app/`: Next.js app router pages
- `components/`: Organized by feature (tree/, tree-editor/, ui/)
- `hooks/`: Custom React hooks for state and configuration
- `lib/`: Utilities, types, store, and configuration logic
- `public/config/`: JSON configuration files
- `public/data/`: Family data storage

### Development Guidelines

From `.cursor/rules/front-end-dev-rules.mdc`:
- Use early returns for readability
- Tailwind classes only (no CSS/styled components)
- Descriptive variable names with "handle" prefix for event handlers
- Implement accessibility features (tabindex, aria-label, keyboard handlers)
- Use const arrow functions with TypeScript types
- Complete implementations without TODOs or placeholders

### Testing & Quality

- ESLint and TypeScript checks disabled during builds (next.config.mjs)
- Manual testing recommended for complex family relationship logic
- Focus on edge cases: orphaned nodes, circular relationships, invalid connections

## Important Notes

- **Relationship Logic**: Complex parent-child-spouse connections handled in `treeSlice.ts`
- **Smart Suggestions**: `SmartSuggestions.ts` analyzes family data to suggest missing relationships
- **Undo/Redo**: Automatic state history (50 levels) for all data modifications
- **Export Features**: Built-in support for PNG/PDF export (html2canvas, jspdf)
- **Performance**: D3.js handles large family trees efficiently with virtualization considerations