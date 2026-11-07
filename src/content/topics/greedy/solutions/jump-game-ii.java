class Solution {
    public int jump(int[] nums) {
        int jumps = 0;
        int curEnd = 0;     // last index of the current BFS level
        int farthest = 0;   // farthest index reachable from the levels scanned so far
        for (int i = 0; i < nums.length - 1; i++) { // never jump from the last index
            farthest = Math.max(farthest, i + nums[i]);
            if (i == curEnd) {                      // current level fully expanded
                jumps++;
                curEnd = farthest;
            }
        }
        return jumps;
    }
}
