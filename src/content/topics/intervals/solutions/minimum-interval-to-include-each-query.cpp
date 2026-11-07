class Solution {
public:
    vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
        vector<vector<int>> sorted = intervals;
        sort(sorted.begin(), sorted.end(), [](auto& a, auto& b) { return a[0] < b[0]; });
        vector<int> order(queries.size());
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return queries[a] < queries[b]; });
        // min-heap of {size, right}
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
        vector<int> ans(queries.size(), -1);

        size_t i = 0;
        for (int qi : order) {
            int q = queries[qi];
            // 1. every interval that has started by q becomes a candidate
            while (i < sorted.size() && sorted[i][0] <= q) {
                int l = sorted[i][0], r = sorted[i][1];
                i++;
                heap.push({r - l + 1, r});
            }
            // 2. lazily drop candidates that ended before q (they can't contain later queries either)
            while (!heap.empty() && heap.top().second < q) heap.pop();
            // 3. the smallest remaining size contains q
            if (!heap.empty()) ans[qi] = heap.top().first;
        }
        return ans;
    }
};
