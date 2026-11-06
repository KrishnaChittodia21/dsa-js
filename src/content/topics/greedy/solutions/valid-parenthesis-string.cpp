class Solution {
public:
    bool checkValidString(string s) {
        int lo = 0; // fewest open brackets possible
        int hi = 0; // most open brackets possible
        for (char ch : s) {
            if (ch == '(') { lo++; hi++; }
            else if (ch == ')') { lo--; hi--; }
            else { lo--; hi++; }      // '*' could be ')', '' or '('
            if (hi < 0) return false; // too many ')' in every interpretation
            lo = max(lo, 0);          // discard interpretations that went negative
        }
        return lo == 0;
    }
};
