class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> heap; // the k largest so far; top = kth largest
        for (int x : nums) {
            heap.push(x);
            if ((int) heap.size() > k) heap.pop();
        }
        return heap.top();
    }
};
