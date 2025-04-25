export interface ILinkedListNode<TKey> {
  prev: ILinkedListNode<TKey> | null;
  next: ILinkedListNode<TKey> | null;
  key: TKey;
}

export class LinkedList<TKey> {
  #head: ILinkedListNode<TKey> | null = null;
  #tail: ILinkedListNode<TKey> | null = null;

  /**
   * The head of the linked list.
   * The head is the oldest node in the list.
   */
  get head(): ILinkedListNode<TKey> | null {
    return this.#head;
  }

  /**
   * The tail of the linked list.
   * The tail is the most recently added node in the list.
   */
  get tail(): ILinkedListNode<TKey> | null {
    return this.#tail;
  }

  add = (node: ILinkedListNode<TKey>): undefined => {
    node.prev = this.#tail;
    node.next = null;

    if (this.#head === null) {
      this.#head = node;
    }

    if (this.#tail !== null) {
      this.#tail.next = node;
    }
    this.#tail = node;
  };

  /**
   * Remove the oldest node from the list.
   */
  removeOldest = (): TKey | undefined => {
    if (this.#head === null) {
      return;
    }

    const removedNode = this.#head;
    if (this.#head.next === null) {
      // Only one node in the list
      this.#head = null;
      this.#tail = null;
      return removedNode.key;
    }

    this.#head = removedNode.next;
    if (this.#head) {
      this.#head.prev = null;
    }

    return removedNode.key;
  };

  /**
   * Remove a node from the list.
   * @param node The node to remove.
   */
  removeNode = (node: ILinkedListNode<TKey>): void => {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      // Node is the head
      this.#head = node.next;
    }

    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      // Node is the tail
      this.#tail = node.prev;
    }

    // Detach the node
    node.prev = null;
    node.next = null;
  };

  /**
   * Demote the node towards the tail of the list.
   * @param node The node to demote.
   */
  demote = (node: ILinkedListNode<TKey>): void => {
    if (node.next === null && node.prev === null) {
      this.add(node);
      return;
    }

    const nextNode = node.next;
    if (nextNode === null) {
      return;
    }

    const parentNode = node.prev ?? null;
    const grandParentNode = nextNode.next ?? null;

    // [parentNode, node, nextNode, grandParentNode] becomes
    // [parentNode, nextNode, node, grandParentNode]

    if (parentNode === null) {
      this.#head = nextNode;
    } else {
      parentNode.next = nextNode;
    }

    nextNode.prev = parentNode;
    nextNode.next = node;

    node.prev = nextNode;
    node.next = grandParentNode;

    if (grandParentNode !== null) {
      grandParentNode.prev = node;
    } else {
      // If grandParentNode is null, node becomes the new tail.
      this.#tail = node;
    }
  };

  clear = (): void => {
    this.#head = null;
    this.#tail = null;
  };
}
