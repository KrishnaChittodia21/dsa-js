class Solution {
public:
    int jump(vector<int>& nums) {
        int n = nums.size();
        int jumps = 0;
        int curEnd = 0;     // last index of the current BFS level
        int farthest = 0;   // farthest index reachable from the levels scanned so far
        for (int i = 0; i < n - 1; i++) {   // never jump from the last index
            farthest = max(farthest, i + nums[i]);
            if (i == curEnd) {              // current level fully expanded
                jumps++;
                curEnd = farthest;
            }
        }
        return jumps;
    }
};
