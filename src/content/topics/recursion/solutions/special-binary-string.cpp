class Solution {
public:
    string makeLargestSpecial(string s) {
        vector<string> blocks;
        int balance = 0, start = 0;
        for (int i = 0; i < (int)s.size(); i++) {
            balance += s[i] == '1' ? 1 : -1;
            if (balance == 0) {
                // s[start..i] is one top-level mountain: "1" + inner + "0"
                string inner = s.substr(start + 1, i - start - 1);
                blocks.push_back("1" + makeLargestSpecial(inner) + "0");
                start = i + 1;
            }
        }
        // any order of adjacent mountains is reachable → biggest first
        sort(blocks.begin(), blocks.end(), greater<string>());
        string result;
        for (const string& b : blocks) result += b;
        return result;
    }
};
