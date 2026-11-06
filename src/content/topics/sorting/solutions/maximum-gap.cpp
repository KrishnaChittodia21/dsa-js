class Solution {
public:
    int maximumGap(vector<int>& nums) {
        int n = nums.size();
        if (n < 2) return 0;
        int lo = *min_element(nums.begin(), nums.end());
        int hi = *max_element(nums.begin(), nums.end());
        if (lo == hi) return 0;

        int width = max(1, (hi - lo) / (n - 1));
        int count = (hi - lo) / width + 1;
        vector<int> bMin(count, INT_MAX), bMax(count, INT_MIN);
        for (int x : nums) {
            int b = (x - lo) / width;
            bMin[b] = min(bMin[b], x);
            bMax[b] = max(bMax[b], x);
        }

        int best = 0;
        int prevMax = lo;
        for (int b = 0; b < count; b++) {
            if (bMin[b] == INT_MAX) continue;   // empty bucket
            best = max(best, bMin[b] - prevMax);
            prevMax = bMax[b];
        }
        return best;
    }
};
