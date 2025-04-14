import { CacheKey } from "./cache-types";

export interface ILinkedListNode {
  prev: ILinkedListNode | null;
  next: ILinkedListNode | null;
  key: CacheKey;
}

export class LinkedList {
  #head: ILinkedListNode | null = null;
  #tail: ILinkedListNode | null = null;

  get head(): ILinkedListNode | null {
    return this.#head;
  }

  get tail(): ILinkedListNode | null {
    return this.#tail;
  }

  add = (node: ILinkedListNode): undefined => {
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

  removeOldest = (): CacheKey | undefined => {
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

  removeNode = (node: ILinkedListNode): void => {
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

  demote = (node: ILinkedListNode): void => {
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
