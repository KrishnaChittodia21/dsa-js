// Singly linked list node — the same shape LeetCode uses.
export class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// [1,2,3] -> 1 -> 2 -> 3
export function arrayToList(arr) {
  const dummy = new ListNode();
  let tail = dummy;
  for (const v of arr) {
    tail.next = new ListNode(v);
    tail = tail.next;
  }
  return dummy.next;
}

// 1 -> 2 -> 3 -> [1,2,3]   (stops after 10^5 nodes to survive accidental cycles)
export function listToArray(head) {
  const out = [];
  let steps = 0;
  while (head && steps++ < 100000) {
    out.push(head.val);
    head = head.next;
  }
  return out;
}

// A small linked list class with the operations interviews ask about.
export class LinkedList {
  constructor(values = []) {
    this.head = null;
    this.tail = null;
    this.length = 0;
    for (const v of values) this.append(v);
  }
  append(val) {
    const node = new ListNode(val);
    if (!this.head) this.head = this.tail = node;
    else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
    return this;
  }
  prepend(val) {
    this.head = new ListNode(val, this.head);
    if (!this.tail) this.tail = this.head;
    this.length++;
    return this;
  }
  removeFirst() {
    if (!this.head) return undefined;
    const val = this.head.val;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.length--;
    return val;
  }
  find(val) {
    let cur = this.head;
    while (cur && cur.val !== val) cur = cur.next;
    return cur;
  }
  reverse() {
    let prev = null;
    let cur = this.head;
    this.tail = this.head;
    while (cur) {
      const next = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
    }
    this.head = prev;
    return this;
  }
  toArray() {
    return listToArray(this.head);
  }
}
