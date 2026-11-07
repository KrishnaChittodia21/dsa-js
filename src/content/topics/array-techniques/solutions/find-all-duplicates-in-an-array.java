class Solution {
    public int[] findDuplicates(int[] nums) {
        List<Integer> dup = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            int v = Math.abs(nums[i]);
            if (nums[v - 1] < 0) dup.add(v);   // second time we see v
            else nums[v - 1] = -nums[v - 1];   // first time: mark it
        }
        return dup.stream().mapToInt(Integer::intValue).toArray();
    }
}
