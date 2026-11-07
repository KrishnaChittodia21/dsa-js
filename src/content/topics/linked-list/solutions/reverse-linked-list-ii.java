class Solution {
    public ListNode reverseBetween(ListNode head, int left, int right) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        for (int i = 1; i < left; i++) prev = prev.next; // node before the segment

        ListNode cur = prev.next;              // first node of the segment
        for (int i = 0; i < right - left; i++) {
            ListNode move = cur.next;          // node to bring to the front
            cur.next = move.next;
            move.next = prev.next;
            prev.next = move;
        }
        return dummy.next;
    }
}
