class Solution {
    public int[] findDisappearedNumbers(int[] nums) {
        for (int i = 0; i < nums.length; i++) {
            int v = Math.abs(nums[i]);              // original value (cell may be marked)
            nums[v - 1] = -Math.abs(nums[v - 1]);   // mark "v seen" (safe to repeat)
        }
        List<Integer> missing = new ArrayList<>();
        for (int j = 0; j < nums.length; j++) {
            if (nums[j] > 0) missing.add(j + 1);    // never marked -> j + 1 missing
        }
        return missing.stream().mapToInt(Integer::intValue).toArray();
    }
}
