class Solution {
    public boolean wordBreak(String s, String[] wordDict) {
        Set<String> dict = new HashSet<>(Arrays.asList(wordDict));
        int maxLen = 0;
        for (String w : wordDict) maxLen = Math.max(maxLen, w.length());
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;                                       // empty prefix
        for (int i = 1; i <= s.length(); i++) {
            for (int j = Math.max(0, i - maxLen); j < i; j++) {
                if (dp[j] && dict.contains(s.substring(j, i))) { // last word is s[j..i)
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.length()];
    }
}
