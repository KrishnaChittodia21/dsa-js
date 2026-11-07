class Solution {
public:
    void reorderList(ListNode* head) {
        if (!head || !head->next) return;
        // 1. first middle
        ListNode* slow = head;
        ListNode* fast = head->next;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        ListNode* second = slow->next;
        slow->next = nullptr;          // cut
        // 2. reverse second half
        ListNode* prev = nullptr;
        while (second) {
            ListNode* next = second->next;
            second->next = prev;
            prev = second;
            second = next;
        }
        // 3. weave
        ListNode* a = head;
        ListNode* b = prev;
        while (b) {
            ListNode* an = a->next;
            ListNode* bn = b->next;
            a->next = b;
            b->next = an;
            a = an;
            b = bn;
        }
    }
};
