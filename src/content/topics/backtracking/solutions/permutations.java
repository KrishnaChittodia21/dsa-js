class Solution {
    private List<int[]> result = new ArrayList<>();
    private int[] path;
    private boolean[] used;

    public int[][] permute(int[] nums) {
        path = new int[nums.length];
        used = new boolean[nums.length];
        backtrack(nums, 0);
        return result.toArray(new int[0][]);
    }

    private void backtrack(int[] nums, int len) {
        if (len == nums.length) {       // every position filled
            result.add(path.clone());
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;      // already in this permutation
            used[i] = true;             // choose
            path[len] = nums[i];
            backtrack(nums, len + 1);   // explore
            used[i] = false;            // undo (path[len] is overwritten next time)
        }
    }
}
