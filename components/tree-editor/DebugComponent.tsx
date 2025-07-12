import React, { useEffect } from "react";
import { useTreeStore } from "../../hooks/useTreeStore";
import { calculateTree } from "../../lib/utils/CalculateTree";

export function DebugComponent() {
  const { data, tree, mainId } = useTreeStore();

  useEffect(() => {
    console.log("=== DEBUG COMPONENT ===");
    console.log("Data keys:", Object.keys(data));
    console.log("Data:", data);
    console.log("Tree length:", tree.length);
    console.log("Tree:", tree);
    console.log("Main ID:", mainId);

    // Test tree calculation manually
    if (Object.keys(data).length > 0 && mainId) {
      console.log("Testing tree calculation...");
      try {
        const testTree = calculateTree({
          data,
          mainId,
          nodeSeparation: 200,
          levelSeparation: 150,
          showSpouses: true,
        });
        console.log("Manual tree calculation result:", testTree);
        console.log("Manual tree length:", testTree.length);
        testTree.forEach((node) => {
          console.log(
            `Manual node ${node.id}: ${node.name} at (${node.x}, ${node.y})`
          );
        });
      } catch (error) {
        console.error("Manual tree calculation failed:", error);
      }
    }
  }, [data, tree, mainId]);

  return (
    <div className='fixed bottom-4 left-4 bg-black text-white p-4 text-xs rounded max-w-md'>
      <div>Data keys: {Object.keys(data).length}</div>
      <div>Tree nodes: {tree.length}</div>
      <div>Main ID: {mainId}</div>
      <div>
        First person:{" "}
        {Object.keys(data)[0] ? data[Object.keys(data)[0]]?.name : "None"}
      </div>
    </div>
  );
}
