class Solution {
    private List<int[]> result = new ArrayList<>();
    private Deque<Integer> path = new ArrayDeque<>();

    public int[][] subsetsWithDup(int[] nums) {
        Arrays.sort(nums); // group duplicates
        backtrack(nums, 0);
        return result.toArray(new int[0][]);
    }

    private void backtrack(int[] nums, int start) {
        result.add(path.stream().mapToInt(Integer::intValue).toArray());
        for (int i = start; i < nums.length; i++) {
            // same value already tried as a sibling at this depth: identical subtree
            if (i > start && nums[i] == nums[i - 1]) continue;
            path.addLast(nums[i]);
            backtrack(nums, i + 1);
            path.removeLast();
        }
    }
}
