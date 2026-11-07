class Solution {
    private List<int[]> result = new ArrayList<>();
    private Deque<Integer> path = new ArrayDeque<>();

    public int[][] combinationSum2(int[] candidates, int target) {
        Arrays.sort(candidates);
        backtrack(candidates, 0, target);
        return result.toArray(new int[0][]);
    }

    private void backtrack(int[] candidates, int start, int remaining) {
        if (remaining == 0) {
            result.add(path.stream().mapToInt(Integer::intValue).toArray());
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (i > start && candidates[i] == candidates[i - 1]) continue; // duplicate sibling
            if (candidates[i] > remaining) break;                          // sorted: stop
            path.addLast(candidates[i]);
            backtrack(candidates, i + 1, remaining - candidates[i]);       // each index once
            path.removeLast();
        }
    }
}
