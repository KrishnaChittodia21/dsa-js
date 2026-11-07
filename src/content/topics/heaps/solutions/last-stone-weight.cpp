class Solution {
public:
    int lastStoneWeight(vector<int>& stones) {
        priority_queue<int> heap(stones.begin(), stones.end());
        while (heap.size() > 1) {
            int y = heap.top(); heap.pop();  // heaviest
            int x = heap.top(); heap.pop();  // second heaviest
            if (y != x) heap.push(y - x);    // the remainder goes back
        }
        return heap.empty() ? 0 : heap.top();
    }
};
