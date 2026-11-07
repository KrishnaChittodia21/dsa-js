class Solution {
public:
    int climbStairs(int n) {
        int prev2 = 1; // ways(0): one way to stand at the bottom — do nothing
        int prev1 = 1; // ways(1)
        for (int i = 2; i <= n; i++) {
            int cur = prev1 + prev2; // last move was 1 step (from i-1) or 2 steps (from i-2)
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
};
