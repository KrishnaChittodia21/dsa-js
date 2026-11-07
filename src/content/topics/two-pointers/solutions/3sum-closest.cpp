class Solution {
public:
    int threeSumClosest(vector<int>& nums, int target) {
        vector<int> a = nums;
        sort(a.begin(), a.end());
        int n = a.size();
        int best = a[0] + a[1] + a[2];
        for (int i = 0; i < n - 2; i++) {
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = a[i] + a[l] + a[r];
                if (abs(sum - target) < abs(best - target)) best = sum;
                if (sum == target) return sum;   // cannot get closer than 0
                if (sum < target) l++;
                else r--;
            }
        }
        return best;
    }
};
