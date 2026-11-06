class Solution {
    vector<string> result;
    string num;
    int target;

    // value and last are long long: a 10-digit operand or a product can pass 2^31
    // last: the last signed term (needed to undo it for '*')
    void backtrack(int pos, const string& expr, long long value, long long last) {
        if (pos == (int)num.size()) {
            if (value == target) result.push_back(expr);
            return;
        }
        for (int end = pos; end < (int)num.size(); end++) {
            if (end > pos && num[pos] == '0') break; // no leading zeros ("05")
            string piece = num.substr(pos, end - pos + 1);
            long long x = stoll(piece);
            if (pos == 0) {
                backtrack(end + 1, piece, x, x);     // first operand: no operator
            } else {
                backtrack(end + 1, expr + "+" + piece, value + x, x);
                backtrack(end + 1, expr + "-" + piece, value - x, -x);
                backtrack(end + 1, expr + "*" + piece, value - last + last * x, last * x);
            }
        }
    }

public:
    vector<string> addOperators(string num, int target) {
        this->num = num;
        this->target = target;
        backtrack(0, "", 0, 0);
        return result;
    }
};
