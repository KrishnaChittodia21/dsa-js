class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0, head);
        ListNode* groupPrev = &dummy;

        while (true) {
            // find the k-th node of this group
            ListNode* kth = groupPrev;
            for (int i = 0; i < k && kth; i++) kth = kth->next;
            if (!kth) break;                        // fewer than k nodes left

            ListNode* groupNext = kth->next;
            ListNode* first = groupPrev->next;      // becomes the group's tail

            // reverse [first .. kth]; prev starts at groupNext so the tail links onward
            ListNode* prev = groupNext;
            ListNode* cur = first;
            while (cur != groupNext) {
                ListNode* next = cur->next;
                cur->next = prev;
                prev = cur;
                cur = next;
            }

            groupPrev->next = kth;                  // connect previous part to new group head
            groupPrev = first;                      // old first is the anchor for the next group
        }
        return dummy.next;
    }
};
