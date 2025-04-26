import * as assert from "assert";
import { CacheKey } from "../api/api-cache-types";
import { ILinkedListNode, LinkedList } from "./linked-list";

suite("LinkedList", () => {
  const createCacheKey = (id: string): CacheKey => ["user", "repo", `endpoint-${id}`, "GET"];

  // Helper function to create a node
  const createNode = (key: CacheKey): ILinkedListNode<CacheKey> => ({
    prev: null,
    next: null,
    key,
  });

  /**
   * Asserts that the nodes are in the correct order and properly linked.
   * Also verifies that the first and last nodes match the head and tail of the linked list.
   */
  const assertNodeOrder = (linkedList: LinkedList<CacheKey>, ...nodes: Array<ILinkedListNode<CacheKey>>) => {
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
      const linkedList = new LinkedList<CacheKey>();
      const key = createCacheKey("1");
      const node = createNode(key);

      // When
      linkedList.add(node);

      // Then
      assert.strictEqual(node.key, key);
      assertNodeOrder(linkedList, node);
      assert.strictEqual(linkedList.head, node);
      assert.strictEqual(linkedList.tail, node);
    });

    test("should connect nodes correctly when adding multiple items", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      // When
      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

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
      const linkedList = new LinkedList<CacheKey>();

      // When
      const result = linkedList.removeOldest();

      // Then
      assert.strictEqual(result, undefined);
      assert.strictEqual(linkedList.head, null);
      assert.strictEqual(linkedList.tail, null);
    });

    test("should remove and return the first item", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      // When
      const removedKey = linkedList.removeOldest();

      // Then
      assert.strictEqual(removedKey, key1);
      assertNodeOrder(linkedList, node2, node3);
    });

    test("should handle removing the last item correctly", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const node1 = createNode(key1);
      linkedList.add(node1);

      // When
      const removedKey = linkedList.removeOldest();
      const emptyResult = linkedList.removeOldest();

      // Then
      assert.strictEqual(removedKey, key1);
      assert.strictEqual(emptyResult, undefined);
      assertNodeOrder(linkedList);
    });
  });

  suite("demote", () => {
    test("should move a node before its grandchild", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");
      const key4 = createCacheKey("4");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);
      const node4 = createNode(key4);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);
      linkedList.add(node4);

      /* Initial state:
       * node1 -> node2 -> node3 -> node4
       */

      // When - demote node2
      linkedList.demote(node2);

      /* After demotion:
       * node1 -> node3 -> node2 -> node4
       */

      // Then
      assertNodeOrder(linkedList, node1, node3, node2, node4);
    });

    test("should handle demoting the head node", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      /* Initial state:
       * node1 -> node2 -> node3
       */

      // When - demote the head node
      linkedList.demote(node1);

      /* After demotion:
       * node2 -> node1 -> node3
       */

      // Then
      assertNodeOrder(linkedList, node2, node1, node3);
      assert.strictEqual(linkedList.head, node2);
    });

    test("should do nothing if node is the tail", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      /* Initial state:
       * node1 -> node2 -> node3
       */

      // When - try to demote the tail node
      linkedList.demote(node3);

      // Then - no changes expected
      assertNodeOrder(linkedList, node1, node2, node3);
    });

    test("should handle demoting to the tail position", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      /* Initial state:
       * node1 -> node2 -> node3
       */

      // When - demote node2, which should move after node3 (becoming the tail)
      linkedList.demote(node2);

      /* After demotion:
       * node1 -> node3 -> node2
       */

      // Then
      assertNodeOrder(linkedList, node1, node3, node2);
      assert.strictEqual(linkedList.tail, node2);
    });

    test("should add the given node if the node isn't in the list, when demoting", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();

      const connectedKey = createCacheKey("connected");
      const disconnectedKey = createCacheKey("disconnected");

      const connectedNode = createNode(connectedKey);
      const disconnectedNode = createNode(disconnectedKey);

      linkedList.add(connectedNode);

      // When
      linkedList.demote(disconnectedNode);

      // Then
      assertNodeOrder(linkedList, connectedNode, disconnectedNode);

      test("should handle a list with only two nodes", () => {
        // Given
        const linkedList = new LinkedList<CacheKey>();
        const key1 = createCacheKey("1");
        const key2 = createCacheKey("2");

        const node1 = createNode(key1);
        const node2 = createNode(key2);

        linkedList.add(node1);
        linkedList.add(node2);

        /* Initial state:
         * node1 -> node2
         */

        // When - demote the first node
        linkedList.demote(node1);

        /* After demotion:
         * node2 -> node1
         */

        // Then
        assertNodeOrder(linkedList, node2, node1);
        assert.strictEqual(linkedList.head, node2);
        assert.strictEqual(linkedList.tail, node1);
      });
    });
  });

  suite("clear", () => {
    test("should remove all nodes", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      // Add nodes to the list and store them to check later
      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

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
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");
      const key4 = createCacheKey("4");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When - multiple operations
      // Demote node1 - should move it after node2
      linkedList.demote(node1);

      // Check intermediate state: node2 -> node1 -> node3
      assertNodeOrder(linkedList, node2, node1, node3);
      assert.strictEqual(linkedList.head, node2);
      assert.strictEqual(linkedList.tail, node3);

      // Add another node
      const node4 = createNode(key4);
      linkedList.add(node4);

      // State after adding node4: node2 -> node1 -> node3 -> node4
      assertNodeOrder(linkedList, node2, node1, node3, node4);

      // Demote node1 - should move it after node3
      linkedList.demote(node1);

      // Verify state after second demotion: node2 -> node3 -> node1 -> node4
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

  suite("remove", () => {
    test("should remove a node from the middle of the list", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.remove(node2);

      // Then
      assertNodeOrder(linkedList, node1, node3);

      // Verify that the removed node is detached
      assert.strictEqual(node2.prev, null);
      assert.strictEqual(node2.next, null);
    });

    test("should remove the head node", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.remove(node1);

      // Then
      assertNodeOrder(linkedList, node2, node3);
      assert.strictEqual(linkedList.head, node2);
      assert.strictEqual(linkedList.tail, node3);
    });

    test("should remove the tail node", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.remove(node3);

      // Then
      assertNodeOrder(linkedList, node1, node2);
      assert.strictEqual(linkedList.head, node1);
      assert.strictEqual(linkedList.tail, node2);
    });

    test("should handle removing the only node in the list", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key = createCacheKey("1");
      const node = createNode(key);
      linkedList.add(node);

      // Initial state: single node
      assertNodeOrder(linkedList, node);

      // When
      linkedList.remove(node);

      // Then
      assertNodeOrder(linkedList);
      assert.strictEqual(linkedList.head, null);
      assert.strictEqual(linkedList.tail, null);
    });

    test("should handle removing multiple nodes in sequence", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");
      const key4 = createCacheKey("4");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);
      const node4 = createNode(key4);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);
      linkedList.add(node4);

      // Initial state: node1 -> node2 -> node3 -> node4
      assertNodeOrder(linkedList, node1, node2, node3, node4);

      // When - remove nodes in sequence
      linkedList.remove(node2);
      // After first removal: node1 -> node3 -> node4
      assertNodeOrder(linkedList, node1, node3, node4);

      linkedList.remove(node4);
      // After second removal: node1 -> node3
      assertNodeOrder(linkedList, node1, node3);

      linkedList.remove(node1);
      // After third removal: node3
      assertNodeOrder(linkedList, node3);

      linkedList.remove(node3);
      // After fourth removal: empty list
      assertNodeOrder(linkedList);
    });

    test("should update next and prev references correctly when removing nodes", () => {
      // Given
      const linkedList = new LinkedList<CacheKey>();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      const node1 = createNode(key1);
      const node2 = createNode(key2);
      const node3 = createNode(key3);

      linkedList.add(node1);
      linkedList.add(node2);
      linkedList.add(node3);

      // Initial state: node1 -> node2 -> node3
      assertNodeOrder(linkedList, node1, node2, node3);

      // When
      linkedList.remove(node2);

      // Then
      assert.strictEqual(node1.next, node3, "Node1 next should point to node3");
      assert.strictEqual(node3.prev, node1, "Node3 prev should point to node1");
      assert.strictEqual(node2.next, null, "Removed node should have next set to null");
      assert.strictEqual(node2.prev, null, "Removed node should have prev set to null");
    });
  });
});
