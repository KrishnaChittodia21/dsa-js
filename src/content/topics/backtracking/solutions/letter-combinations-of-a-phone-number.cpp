class Solution {
    const vector<string> keypad = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    vector<string> result;
    string path;

    void backtrack(const string& digits, int i) {
        if (i == (int)digits.size()) {
            result.push_back(path); // copy the string once, at the leaf
            return;
        }
        for (char ch : keypad[digits[i] - '0']) {
            path.push_back(ch);
            backtrack(digits, i + 1);
            path.pop_back();
        }
    }

public:
    vector<string> letterCombinations(string digits) {
        if (digits.empty()) return {};
        backtrack(digits, 0);
        return result;
    }
};
