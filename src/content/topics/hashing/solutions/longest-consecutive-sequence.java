class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int x : nums) set.add(x);
        int best = 0;
        for (int x : set) {
            if (set.contains(x - 1)) continue;   // not the start of a run
            int y = x;
            while (set.contains(y + 1)) y++;     // walk the run
            best = Math.max(best, y - x + 1);
        }
        return best;
    }
}
