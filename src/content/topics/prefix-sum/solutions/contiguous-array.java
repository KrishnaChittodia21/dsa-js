class Solution {
    public int findMaxLength(int[] nums) {
        Map<Integer, Integer> first = new HashMap<>(); // balance -> first index where it occurred
        first.put(0, -1);
        int balance = 0, best = 0;
        for (int i = 0; i < nums.length; i++) {
            balance += nums[i] == 1 ? 1 : -1;
            Integer j = first.get(balance);
            if (j != null) {
                best = Math.max(best, i - j); // (first, i] is balanced
            } else {
                first.put(balance, i);        // keep only the earliest
            }
        }
        return best;
    }
}
