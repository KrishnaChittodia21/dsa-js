class Solution {
public:
    vector<vector<string>> partition(string s) {
        vector<vector<string>> result;
        vector<string> path;
        backtrack(s, 0, path, result);
        return result;
    }

private:
    void backtrack(const string& s, int start, vector<string>& path, vector<vector<string>>& result) {
        if (start == (int)s.size()) {            // the whole string is cut into palindromes
            result.push_back(path);
            return;
        }
        for (int end = start; end < (int)s.size(); end++) {
            if (!isPalindrome(s, start, end)) continue;   // prune this cut
            path.push_back(s.substr(start, end - start + 1));
            backtrack(s, end + 1, path, result);
            path.pop_back();
        }
    }

    bool isPalindrome(const string& s, int l, int r) {
        while (l < r) if (s[l++] != s[r--]) return false;
        return true;
    }
};
