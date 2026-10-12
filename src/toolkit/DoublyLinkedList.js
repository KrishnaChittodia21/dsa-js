// Doubly linked list with sentinel head/tail nodes.
// Sentinels remove every "is this the first/last node?" special case,
// which is exactly what LRU / LFU caches need: O(1) remove of any node.
export class DLLNode {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

export class DoublyLinkedList {
  constructor() {
    this.head = new DLLNode(null, null); // sentinel before the first node
    this.tail = new DLLNode(null, null); // sentinel after the last node
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.length = 0;
  }
  // Insert right after the head sentinel (front of the list).
  addFront(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
    this.length++;
    return node;
  }
  addBack(node) {
    node.next = this.tail;
    node.prev = this.tail.prev;
    this.tail.prev.next = node;
    this.tail.prev = node;
    this.length++;
    return node;
  }
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = node.next = null;
    this.length--;
    return node;
  }
  moveToFront(node) {
    this.remove(node);
    this.addFront(node);
  }
  popBack() {
    if (this.length === 0) return null;
    return this.remove(this.tail.prev);
  }
  popFront() {
    if (this.length === 0) return null;
    return this.remove(this.head.next);
  }
  isEmpty() {
    return this.length === 0;
  }
  toArray() {
    const out = [];
    for (let n = this.head.next; n !== this.tail; n = n.next) out.push(n.val);
    return out;
  }
}
