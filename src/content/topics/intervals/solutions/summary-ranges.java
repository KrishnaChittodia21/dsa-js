class Solution {
    public String[] summaryRanges(int[] nums) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < nums.length) {
            int start = nums[i];
            // extend the run while the next number is exactly one more (long: no wrap at Integer.MAX_VALUE)
            while (i + 1 < nums.length && nums[i + 1] == (long) nums[i] + 1) i++;
            int end = nums[i];
            out.add(start == end ? String.valueOf(start) : start + "->" + end);
            i++;
        }
        return out.toArray(new String[0]);
    }
}
