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

  add = (key: CacheKey): ILinkedListNode => {
    const newNode: ILinkedListNode = {
      prev: this.#tail,
      next: null,
      key,
    };

    if (this.#head === null) {
      this.#head = newNode;
    }

    if (this.#tail !== null) {
      this.#tail.next = newNode;
    }
    this.#tail = newNode;
    return newNode;
  };

  pop = (): CacheKey | undefined => {
    if (this.#tail === null) {
      return;
    }

    const poppedNode = this.#tail;
    if (this.#tail.prev === null) {
      this.#head = null;
      this.#tail = null;
      return poppedNode.key;
    }

    this.#tail = poppedNode.prev;
    if (this.#tail !== null) {
      this.#tail.next = null;
    }

    return poppedNode.key;
  };

  promote = (node: ILinkedListNode): void => {
    if (node === this.#head) {
      return;
    }

    const parentNode = node.prev;
    const grandParentNode = parentNode?.prev ?? null;
    const nextNode = node.next;

    // [grandParentNode, parentNode, node, nextNode] becomes
    // [grandParentNode, node, parentNode, nextNode]

    if (grandParentNode === null) {
      this.#head = node;
    } else {
      grandParentNode.next = node;
    }

    node.prev = grandParentNode;
    node.next = parentNode;

    if (parentNode !== null) {
      parentNode.prev = node;
      parentNode.next = nextNode;
    }

    if (nextNode !== null) {
      nextNode.prev = parentNode;
    } else {
      // If nextNode is null, parentNode becomes the new tail.
      this.#tail = parentNode;
    }
  };

  clear = (): void => {
    this.#head = null;
    this.#tail = null;
  };
}
