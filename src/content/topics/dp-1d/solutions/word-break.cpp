class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> dict(wordDict.begin(), wordDict.end());
        int maxLen = 0;
        for (const string& w : wordDict) maxLen = max(maxLen, (int)w.size());
        int n = s.size();
        vector<bool> dp(n + 1, false);
        dp[0] = true;                                       // empty prefix
        for (int i = 1; i <= n; i++) {
            for (int j = max(0, i - maxLen); j < i; j++) {
                if (dp[j] && dict.count(s.substr(j, i - j))) { // last word is s[j..i)
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[n];
    }
};
