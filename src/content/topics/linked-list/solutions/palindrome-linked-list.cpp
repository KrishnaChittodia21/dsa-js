class Solution {
public:
    bool isPalindrome(ListNode* head) {
        // 1. middle
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        // 2. reverse the second half
        ListNode* prev = nullptr;
        while (slow) {
            ListNode* next = slow->next;
            slow->next = prev;
            prev = slow;
            slow = next;
        }
        // 3. compare
        ListNode* a = head;
        ListNode* b = prev;
        while (b) {
            if (a->val != b->val) return false;
            a = a->next;
            b = b->next;
        }
        return true;
    }
};
