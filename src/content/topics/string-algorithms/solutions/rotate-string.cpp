class Solution {
public:
    bool rotateString(string s, string goal) {
        if (s.size() != goal.size()) return false;
        string text = s + s;
        int m = goal.size();

        vector<int> lps(m, 0);
        for (int i = 1, len = 0; i < m; i++) {
            while (len > 0 && goal[i] != goal[len]) len = lps[len - 1];
            if (goal[i] == goal[len]) len++;
            lps[i] = len;
        }
        for (int i = 0, j = 0; i < (int) text.size(); i++) {
            while (j > 0 && text[i] != goal[j]) j = lps[j - 1];
            if (text[i] == goal[j]) j++;
            if (j == m) return true;
        }
        return false;
    }
};
