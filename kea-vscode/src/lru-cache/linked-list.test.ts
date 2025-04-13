import * as assert from "assert";
import { CacheKey } from "./cache-types";
import { ILinkedListNode, LinkedList } from "./linked-list";

suite("LinkedList", () => {
  const createCacheKey = (id: string): CacheKey => ["user", "repo", `endpoint-${id}`, "GET"];

  /**
   * Asserts that the nodes are in the correct order and properly linked.
   * Also verifies that the first and last nodes match the head and tail of the linked list.
   */
  const assertNodeOrder = (linkedList: LinkedList, ...nodes: ILinkedListNode[]) => {
    // Check if nodes array is empty
    if (nodes.length === 0) {
      assert.strictEqual(linkedList.head, null);
      assert.strictEqual(linkedList.tail, null);
      return;
    }

    // Check that head and tail references are correct
    assert.strictEqual(linkedList.head, nodes[0], "First node should be the head of the linked list");
    assert.strictEqual(linkedList.tail, nodes[nodes.length - 1], "Last node should be the tail of the linked list");

    // Check connections between nodes
    for (let idx = 0; idx < nodes.length; idx++) {
      if (idx === 0) {
        assert.strictEqual(nodes[idx]!.prev, null, `Head node (index ${idx}) should have prev=null`);
      } else {
        assert.strictEqual(nodes[idx]!.prev, nodes[idx - 1], `Node at index ${idx} should have previous node as prev`);
      }

      if (idx === nodes.length - 1) {
        assert.strictEqual(nodes[idx]!.next, null, `Tail node (index ${idx}) should have next=null`);
      } else {
        assert.strictEqual(nodes[idx]!.next, nodes[idx + 1], `Node at index ${idx} should have next node as next`);
      }
    }
  };

  suite("add", () => {
    test("should add a node and return it", () => {
      // Given
      const linkedList = new LinkedList();
      const key = createCacheKey("1");

      // When
      const node = linkedList.add(key);

      // Then
      assert.strictEqual(node.key, key);
      assertNodeOrder(linkedList, node);
      assert.strictEqual(linkedList.head, node);
      assert.strictEqual(linkedList.tail, node);
    });

    test("should connect nodes correctly when adding multiple items", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      // When
      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Then
      assert.strictEqual(node1.key, key1);
      assert.strictEqual(node2.key, key2);
      assert.strictEqual(node3.key, key3);

      assertNodeOrder(linkedList, node1, node2, node3);

      assert.strictEqual(linkedList.head, node1);
      assert.strictEqual(linkedList.tail, node3);
    });
  });

  suite("removeOldest", () => {
    test("should return undefined for empty list", () => {
      // Given
      const linkedList = new LinkedList();

      // When
      const result = linkedList.removeOldest();

      // Then
      assert.strictEqual(result, undefined);
      assert.strictEqual(linkedList.head, null);
      assert.strictEqual(linkedList.tail, null);
    });

    test("should remove and return the first item", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // When
      const removedKey = linkedList.removeOldest();

      // Then
      assert.strictEqual(removedKey, key1);
      assertNodeOrder(linkedList, node2, node3);
    });

    test("should handle removing the last item correctly", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      linkedList.add(key1);

      // When
      const removedKey = linkedList.removeOldest();
      const emptyResult = linkedList.removeOldest();

      // Then
      assert.strictEqual(removedKey, key1);
      assert.strictEqual(emptyResult, undefined);
      assertNodeOrder(linkedList);
    });
  });

  suite("promote", () => {
    test("should move a node after its grandparent", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");
      const key4 = createCacheKey("4");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);
      const node4 = linkedList.add(key4);

      /* Initial state:
       * node1 -> node2 -> node3 -> node4
       */

      // When - promote node3
      linkedList.promote(node3);

      /* After promotion:
       * node1 -> node3 -> node2 -> node4
       */

      // Then
      assertNodeOrder(linkedList, node1, node3, node2, node4);
    });

    test("should handle promoting to head correctly", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);

      /* Initial state:
       * node1 -> node2
       */

      // When - promote node2 (should become the head)
      linkedList.promote(node2);

      /* After promotion:
       * node2 -> node1
       */

      // Then
      assertNodeOrder(linkedList, node2, node1);
    });

    test("should handle promoting the tail node correctly", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      /* Initial state:
       * node1 -> node2 -> node3
       */

      // When - promote the tail node (node3)
      linkedList.promote(node3);

      /* After promotion:
       * node1 -> node3 -> node2
       */

      // Then
      assertNodeOrder(linkedList, node1, node3, node2);
    });

    test("should do nothing if node has no parent", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");

      // Create a standalone node that's not connected to the linkedList
      const node = {
        prev: null,
        next: null,
        key: key1,
      };

      // Save initial state
      const initialPrev = node.prev;
      const initialNext = node.next;
      const initialKey = [...node.key]; // Create a copy of the key array

      // When
      linkedList.promote(node);

      // Then - node should remain unchanged
      assert.strictEqual(node.prev, initialPrev, "prev property should not change");
      assert.strictEqual(node.next, initialNext, "next property should not change");
      assert.deepStrictEqual(node.key, initialKey, "key property should not change");

      // Also verify that the linkedList state remains unchanged
      assert.strictEqual(linkedList.head, null, "head should remain null");
      assert.strictEqual(linkedList.tail, null, "tail should remain null");
    });

    test("should do nothing if node is already head", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);

      // When - try to promote the head
      linkedList.promote(node1);

      // Then - no changes expected
      assertNodeOrder(linkedList, node1, node2);
    });
  });

  suite("clear", () => {
    test("should remove all nodes", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      // Add nodes to the list and store them to check later
      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Verify initial state
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.clear();

      // Then
      assertNodeOrder(linkedList);
    });
  });

  suite("operations sequence", () => {
    test("should work correctly when performing multiple operations", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");
      const key4 = createCacheKey("4");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When - multiple operations
      // Promote node2 - should move it after node1's grandparent (which is null, so node2 becomes head)
      linkedList.promote(node2);

      // Check intermediate state: node2 -> node1 -> node3
      assertNodeOrder(linkedList, node2, node1, node3);
      assert.strictEqual(linkedList.head, node2);
      assert.strictEqual(linkedList.tail, node3);

      // Add another node
      const node4 = linkedList.add(key4);

      // State after adding node4: node2 -> node1 -> node3 -> node4
      assertNodeOrder(linkedList, node2, node1, node3, node4);

      // Promote node3 - should move it after node1's grandparent (which is node2)
      linkedList.promote(node3);

      // Verify state after second promotion: node2 -> node3 -> node1 -> node4
      assertNodeOrder(linkedList, node2, node3, node1, node4);
      assert.strictEqual(linkedList.head, node2);
      assert.strictEqual(linkedList.tail, node4);

      // Remove the head node
      const removedKey = linkedList.removeOldest();

      // Then
      assert.strictEqual(removedKey, key2);

      // Final state should be: node3 -> node1 -> node4
      assertNodeOrder(linkedList, node3, node1, node4);
      assert.strictEqual(linkedList.head, node3);
      assert.strictEqual(linkedList.tail, node4);
    });
  });

  suite("removeNode", () => {
    test("should remove a node from the middle of the list", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.removeNode(node2);

      // Then
      assertNodeOrder(linkedList, node1, node3);

      // Verify that the removed node is detached
      assert.strictEqual(node2.prev, null);
      assert.strictEqual(node2.next, null);
    });

    test("should remove the head node", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.removeNode(node1);

      // Then
      assertNodeOrder(linkedList, node2, node3);
      assert.strictEqual(linkedList.head, node2);
      assert.strictEqual(linkedList.tail, node3);
    });

    test("should remove the tail node", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.removeNode(node3);

      // Then
      assertNodeOrder(linkedList, node1, node2);
      assert.strictEqual(linkedList.head, node1);
      assert.strictEqual(linkedList.tail, node2);
    });

    test("should handle removing the only node in the list", () => {
      // Given
      const linkedList = new LinkedList();
      const key = createCacheKey("1");
      const node = linkedList.add(key);

      // Initial state: single node
      assertNodeOrder(linkedList, node);

      // When
      linkedList.removeNode(node);

      // Then
      assertNodeOrder(linkedList);
      assert.strictEqual(linkedList.head, null);
      assert.strictEqual(linkedList.tail, null);
    });

    test("should handle removing multiple nodes in sequence", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");
      const key4 = createCacheKey("4");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);
      const node4 = linkedList.add(key4);

      // Initial state: node1 -> node2 -> node3 -> node4
      assertNodeOrder(linkedList, node1, node2, node3, node4);

      // When - remove nodes in sequence
      linkedList.removeNode(node2);
      // After first removal: node1 -> node3 -> node4
      assertNodeOrder(linkedList, node1, node3, node4);

      linkedList.removeNode(node4);
      // After second removal: node1 -> node3
      assertNodeOrder(linkedList, node1, node3);

      linkedList.removeNode(node1);
      // After third removal: node3
      assertNodeOrder(linkedList, node3);

      linkedList.removeNode(node3);
      // After fourth removal: empty list
      assertNodeOrder(linkedList);
    });

    test("should update next and prev references correctly when removing nodes", () => {
      // Given
      const linkedList = new LinkedList();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = linkedList.add(key1);
      const node2 = linkedList.add(key2);
      const node3 = linkedList.add(key3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.removeNode(node2);

      // Then
      assert.strictEqual(node1.next, node3, "Node1 next should point to node3");
      assert.strictEqual(node3.prev, node1, "Node3 prev should point to node1");
      assert.strictEqual(node2.next, null, "Removed node should have next set to null");
      assert.strictEqual(node2.prev, null, "Removed node should have prev set to null");
    });
  });
});
