class Solution {
    public boolean checkSubarraySum(int[] nums, int k) {
        Map<Integer, Integer> firstIndex = new HashMap<>(); // remainder -> earliest prefix index
        firstIndex.put(0, -1);
        int rem = 0;
        for (int i = 0; i < nums.length; i++) {
            rem = (int) ((((long) rem + nums[i]) % k + k) % k); // normalised remainder (long: rem + x can pass 2^31)
            Integer j = firstIndex.get(rem);
            if (j != null) {
                if (i - j >= 2) return true;  // subarray length >= 2
            } else {
                firstIndex.put(rem, i);       // never overwrite: keep the earliest
            }
        }
        return false;
    }
}
