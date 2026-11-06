class Solution {
    public int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {
        Map<Integer, Integer> ab = new HashMap<>();   // sum a + b -> how many pairs
        for (int a : nums1) {
            for (int b : nums2) {
                ab.merge(a + b, 1, (x, y) -> x + y);
            }
        }
        int count = 0;
        for (int c : nums3) {
            for (int d : nums4) {
                count += ab.getOrDefault(-(c + d), 0);   // complement lookup
            }
        }
        return count;
    }
}
