class Solution {
public:
    bool canJump(vector<int>& nums) {
        int n = nums.size();
        int reach = 0;                          // every index <= reach is reachable
        for (int i = 0; i < n; i++) {
            if (i > reach) return false;        // gap: i cannot be reached
            reach = max(reach, i + nums[i]);
            if (reach >= n - 1) return true;
        }
        return true;
    }
};
