class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = nums.size();
        // Cyclic sort: value v belongs at index v (value n has no slot).
        int i = 0;
        while (i < n) {
            int v = nums[i];
            if (v < n && nums[v] != v) {
                swap(nums[i], nums[v]);
            } else {
                i++;
            }
        }
        for (int j = 0; j < n; j++) {
            if (nums[j] != j) return j;
        }
        return n;
    }
};
