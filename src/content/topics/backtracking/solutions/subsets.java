class Solution {
    private List<int[]> result = new ArrayList<>();
    private Deque<Integer> path = new ArrayDeque<>();

    public int[][] subsets(int[] nums) {
        backtrack(nums, 0);
        return result.toArray(new int[0][]);
    }

    private void backtrack(int[] nums, int start) {
        result.add(path.stream().mapToInt(Integer::intValue).toArray()); // every node is a subset: store a copy
        for (int i = start; i < nums.length; i++) {
            path.addLast(nums[i]);  // choose
            backtrack(nums, i + 1); // explore only later elements
            path.removeLast();      // undo
        }
    }
}
