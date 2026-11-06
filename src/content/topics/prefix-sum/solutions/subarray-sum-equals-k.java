class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>(); // prefix value -> how many times seen
        seen.put(0, 1);                               // empty prefix once
        int cur = 0, count = 0;
        for (int x : nums) {
            cur += x;
            count += seen.getOrDefault(cur - k, 0); // starts that make a sum-k subarray ending here
            seen.merge(cur, 1, (a, b) -> a + b);       // record AFTER the lookup
        }
        return count;
    }
}
