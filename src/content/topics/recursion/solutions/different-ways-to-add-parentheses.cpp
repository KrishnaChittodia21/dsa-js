class Solution {
public:
    vector<int> diffWaysToCompute(string expression) {
        return solve(expression);
    }

private:
    unordered_map<string, vector<int>> memo;    // substring → all its values

    vector<int> solve(const string& expr) {
        auto it = memo.find(expr);
        if (it != memo.end()) return it->second;
        vector<int> out;
        for (int i = 0; i < (int)expr.size(); i++) {
            char op = expr[i];
            if (op != '+' && op != '-' && op != '*') continue;
            vector<int> left = solve(expr.substr(0, i));   // every value of the left side
            vector<int> right = solve(expr.substr(i + 1)); // every value of the right side
            for (int a : left) {
                for (int b : right) {
                    out.push_back(op == '+' ? a + b : op == '-' ? a - b : a * b);
                }
            }
        }
        if (out.empty()) out.push_back(stoi(expr)); // base case: plain number
        memo[expr] = out;
        return out;
    }
};
