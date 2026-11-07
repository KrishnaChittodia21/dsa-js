class Solution {
    public int[] majorityElement(int[] nums) {
        int c1 = 0, n1 = 0, c2 = 0, n2 = 0;
        for (int x : nums) {
            if (n1 > 0 && x == c1) n1++;
            else if (n2 > 0 && x == c2) n2++;
            else if (n1 == 0) { c1 = x; n1 = 1; }
            else if (n2 == 0) { c2 = x; n2 = 1; }
            else { n1--; n2--; }            // x, c1 and c2 are three distinct votes → cancel
        }
        // Verify: voting only produces candidates.
        int k1 = 0, k2 = 0;
        for (int x : nums) {
            if (n1 > 0 && x == c1) k1++;
            else if (n2 > 0 && x == c2) k2++;
        }
        List<Integer> res = new ArrayList<>();
        int limit = nums.length / 3;
        if (k1 > limit) res.add(c1);
        if (k2 > limit) res.add(c2);
        return res.stream().mapToInt(Integer::intValue).toArray();
    }
}
