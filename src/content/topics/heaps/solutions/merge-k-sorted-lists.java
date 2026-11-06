class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
        for (ListNode head : lists) if (head != null) heap.offer(head); // skip empty lists

        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (!heap.isEmpty()) {
            ListNode node = heap.poll();             // smallest current head
            tail.next = node;
            tail = node;
            if (node.next != null) heap.offer(node.next); // that list's new head
        }
        tail.next = null;
        return dummy.next;
    }
}
