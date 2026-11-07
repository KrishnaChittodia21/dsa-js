class Solution {
public:
    int minimumDifference(vector<int>& nums, int k) {
        vector<int> sorted = nums; // don't mutate input
        sort(sorted.begin(), sorted.end());
        int best = INT_MAX;
        for (int i = 0; i + k - 1 < (int)sorted.size(); i++) {
            best = min(best, sorted[i + k - 1] - sorted[i]); // window [i, i+k-1]
        }
        return best;
    }
};
