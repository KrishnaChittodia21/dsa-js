class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int n = text2.size();
        vector<int> prev(n + 1, 0);                  // row i-1
        for (int i = 1; i <= (int)text1.size(); i++) {
            vector<int> cur(n + 1, 0);               // row i (cur[0] = 0: empty text2 prefix)
            for (int j = 1; j <= n; j++) {
                cur[j] = text1[i - 1] == text2[j - 1]
                    ? prev[j - 1] + 1                // match: diagonal + 1
                    : max(prev[j], cur[j - 1]);      // drop one character
            }
            prev = move(cur);
        }
        return prev[n];
    }
};
