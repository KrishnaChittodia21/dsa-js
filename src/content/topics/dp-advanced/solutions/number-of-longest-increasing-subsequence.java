class Solution {
    public int findNumberOfLIS(int[] nums) {
        int n = nums.length;
        int[] len = new int[n];   // LIS length ending at i
        int[] cnt = new int[n];   // how many of them
        Arrays.fill(len, 1);
        Arrays.fill(cnt, 1);
        int maxLen = 1;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] >= nums[i]) continue;
                if (len[j] + 1 > len[i]) {          // found a longer way → reset the count
                    len[i] = len[j] + 1;
                    cnt[i] = cnt[j];
                } else if (len[j] + 1 == len[i]) {  // another way of the same best length
                    cnt[i] += cnt[j];
                }
            }
            maxLen = Math.max(maxLen, len[i]);
        }
        int total = 0;
        for (int i = 0; i < n; i++) if (len[i] == maxLen) total += cnt[i];
        return total;
    }
}
