class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> heap(cmp);
        for (ListNode* head : lists) if (head) heap.push(head); // skip empty lists

        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (!heap.empty()) {
            ListNode* node = heap.top(); heap.pop(); // smallest current head
            tail->next = node;
            tail = node;
            if (node->next) heap.push(node->next);   // that list's new head
        }
        tail->next = nullptr;
        return dummy.next;
    }
};
