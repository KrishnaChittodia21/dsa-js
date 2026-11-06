class Solution {
    private List<int[]> result = new ArrayList<>();
    private Deque<Integer> path = new ArrayDeque<>();

    public int[][] combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates); // enables the early break
        backtrack(candidates, 0, target);
        return result.toArray(new int[0][]);
    }

    private void backtrack(int[] candidates, int start, int remaining) {
        if (remaining == 0) {
            result.add(path.stream().mapToInt(Integer::intValue).toArray());
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (candidates[i] > remaining) break;                // sorted: nothing later fits either
            path.addLast(candidates[i]);
            backtrack(candidates, i, remaining - candidates[i]); // i: the same number may be reused
            path.removeLast();
        }
    }
}
