class Solution {
    public boolean canCross(int[] stones) {
        // position -> set of jump sizes that can land on it
        Map<Integer, Set<Integer>> reach = new HashMap<>();
        for (int p : stones) reach.put(p, new HashSet<>());
        reach.get(0).add(0);                         // "previous jump 0" -> first jump is exactly 1
        for (int pos : stones) {
            for (int k : reach.get(pos)) {
                for (int step = k - 1; step <= k + 1; step++) {
                    if (step <= 0) continue;         // must move forward
                    Set<Integer> target = reach.get(pos + step);
                    if (target != null) target.add(step); // there is a stone there
                }
            }
        }
        return !reach.get(stones[stones.length - 1]).isEmpty();
    }
}
