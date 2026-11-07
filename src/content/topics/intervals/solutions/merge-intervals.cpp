class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        vector<vector<int>> sorted = intervals;
        sort(sorted.begin(), sorted.end(), [](auto& a, auto& b) { return a[0] < b[0]; });
        vector<vector<int>> out;
        for (auto& iv : sorted) {
            if (!out.empty() && iv[0] <= out.back()[1]) {
                out.back()[1] = max(out.back()[1], iv[1]); // overlap: stretch the current block
            } else {
                out.push_back({iv[0], iv[1]});              // gap: start a new block
            }
        }
        return out;
    }
};
