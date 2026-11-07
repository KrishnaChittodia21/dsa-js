class Solution {
public:
    vector<vector<int>> kSmallestPairs(vector<int>& nums1, vector<int>& nums2, int k) {
        // min-heap of {sum, i, j}; sum as long long so two large ints cannot overflow
        priority_queue<tuple<long long, int, int>, vector<tuple<long long, int, int>>, greater<>> pq;
        for (int i = 0; i < min(k, (int) nums1.size()); i++) pq.emplace((long long) nums1[i] + nums2[0], i, 0);
        vector<vector<int>> out;
        while ((int) out.size() < k && !pq.empty()) {
            auto [sum, i, j] = pq.top();
            pq.pop();
            out.push_back({nums1[i], nums2[j]});
            if (j + 1 < (int) nums2.size()) pq.emplace((long long) nums1[i] + nums2[j + 1], i, j + 1); // next in row i
        }
        return out;
    }
};
