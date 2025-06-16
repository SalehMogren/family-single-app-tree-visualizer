import { FamilyMember, FamilyTree } from "../types";

interface NewPersonParams {
  tree: FamilyTree;
  data: {
    name: string;
    gender: "male" | "female";
    birth_year: number;
    type: "parent" | "spouse" | "child";
    targetId: string;
  };
}

export function newPerson({ tree, data }: NewPersonParams): FamilyTree {
  const newId = Math.random().toString(36).substr(2, 9);
  const { name, gender, birth_year, type, targetId } = data;

  const newMember: FamilyMember = {
    id: newId,
    name,
    gender,
    birth_year,
    parents: [],
    spouses: [],
    children: [],
  };

  const updatedMembers = { ...tree.members };
  const targetMember = updatedMembers[targetId];

  if (!targetMember) return tree;

  // Add the new member
  updatedMembers[newId] = newMember;

  // Update relationships based on type
  switch (type) {
    case "parent":
      // Add parent to target's parents
      if (!targetMember.parents) targetMember.parents = [];
      targetMember.parents.push(newId);

      // Add target to parent's children
      if (!newMember.children) newMember.children = [];
      newMember.children.push(targetId);
      break;

    case "spouse":
      // Add spouse relationship (bidirectional)
      if (!targetMember.spouses) targetMember.spouses = [];
      targetMember.spouses.push(newId);

      if (!newMember.spouses) newMember.spouses = [];
      newMember.spouses.push(targetId);
      break;

    case "child":
      // Add child to target's children
      if (!targetMember.children) targetMember.children = [];
      targetMember.children.push(newId);

      // Add target to child's parents
      if (!newMember.parents) newMember.parents = [];
      newMember.parents.push(targetId);
      break;
  }

  return {
    ...tree,
    members: updatedMembers,
  };
}
