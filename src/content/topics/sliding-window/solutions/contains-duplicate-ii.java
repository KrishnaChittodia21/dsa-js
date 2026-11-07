class Solution {
    public boolean containsNearbyDuplicate(int[] nums, int k) {
        Set<Integer> window = new HashSet<>(); // values at indices i-k .. i-1
        for (int i = 0; i < nums.length; i++) {
            if (window.contains(nums[i])) return true;
            window.add(nums[i]);
            if (i >= k) window.remove(nums[i - k]); // keep at most k values
        }
        return false;
    }
}
