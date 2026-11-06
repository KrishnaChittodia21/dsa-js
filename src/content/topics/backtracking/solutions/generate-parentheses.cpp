class Solution {
public:
    vector<string> generateParenthesis(int n) {
        vector<string> result;
        string path;
        backtrack(n, 0, 0, path, result);
        return result;
    }

private:
    void backtrack(int n, int open, int close, string& path, vector<string>& result) {
        if ((int)path.size() == 2 * n) {
            result.push_back(path);
            return;
        }
        if (open < n) {                 // can still open a new pair
            path.push_back('(');
            backtrack(n, open + 1, close, path, result);
            path.pop_back();
        }
        if (close < open) {             // there is an unmatched '(' to close
            path.push_back(')');
            backtrack(n, open, close + 1, path, result);
            path.pop_back();
        }
    }
};
