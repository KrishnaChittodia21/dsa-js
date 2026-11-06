class Solution {
    struct Frame { string state; int nextDigit; int edgeDigit; }; // edgeDigit = -1 for the start

public:
    string crackSafe(int n, int k) {
        unordered_set<string> used; // passwords (edges) already used
        string digits;
        string start(n - 1, '0');

        // Iterative Hierholzer DFS (explicit stack) so deep inputs don't overflow the browser's stack.
        vector<Frame> stack;
        stack.push_back({start, 0, -1});

        while (!stack.empty()) {
            Frame& top = stack.back();
            if (top.nextDigit < k) {
                int d = top.nextDigit++;
                string password = top.state + char('0' + d);
                if (!used.insert(password).second) continue;
                stack.push_back({password.substr(1), 0, d}); // next state = last n - 1 digits
            } else {
                int edge = top.edgeDigit;
                stack.pop_back();
                if (edge >= 0) digits += char('0' + edge); // post-order: record the edge after its subtree
            }
        }
        return digits + start;
    }
};
