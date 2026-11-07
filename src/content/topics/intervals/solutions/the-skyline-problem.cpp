class Solution {
public:
    vector<vector<int>> getSkyline(vector<vector<int>>& buildings) {
        vector<pair<int, int>> events;
        for (const auto& b : buildings) {
            events.push_back({b[0], -b[2]}); // start: negative height
            events.push_back({b[1], b[2]});  // end: positive height
        }
        // x ascending; ties: starts before ends, taller starts first, shorter ends first
        sort(events.begin(), events.end());

        priority_queue<int> heap;
        heap.push(0);                     // the ground is always "active"
        unordered_map<int, int> removed;  // height -> pending removals (lazy deletion)
        vector<vector<int>> result;
        int prev = 0;

        for (const auto& [x, v] : events) {
            if (v < 0) {
                heap.push(-v);
            } else {
                removed[v]++;
            }
            // discard stale maxima
            while (removed.count(heap.top()) && removed[heap.top()] > 0) {
                removed[heap.top()]--;
                heap.pop();
            }
            int cur = heap.top();
            if (cur != prev) {
                result.push_back({x, cur});
                prev = cur;
            }
        }
        return result;
    }
};
