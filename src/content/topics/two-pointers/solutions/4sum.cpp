class Solution {
public:
    vector<vector<int>> fourSum(vector<int>& nums, int target) {
        vector<int> a = nums;
        sort(a.begin(), a.end());
        int n = a.size();
        vector<vector<int>> result;
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && a[j] == a[j - 1]) continue;
                long long need = (long long) target - a[i] - a[j];   // values up to 10^9: sums need long long
                int l = j + 1, r = n - 1;
                while (l < r) {
                    long long sum = (long long) a[l] + a[r];
                    if (sum < need) l++;
                    else if (sum > need) r--;
                    else {
                        result.push_back({a[i], a[j], a[l], a[r]});
                        l++;
                        r--;
                        while (l < r && a[l] == a[l - 1]) l++;
                        while (l < r && a[r] == a[r + 1]) r--;
                    }
                }
            }
        }
        return result;
    }
};
