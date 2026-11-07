class Solution {
public:
    string reorganizeString(string s) {
        unordered_map<char, int> count;
        for (char c : s) count[c]++;
        int maxCount = 0;
        for (auto& [c, n] : count) maxCount = max(maxCount, n);
        if (maxCount > ((int) s.size() + 1) / 2) return "";
        priority_queue<pair<int, char>> heap;          // {remaining, char}
        for (auto& [c, n] : count) heap.emplace(n, c);
        string out;
        pair<int, char> held = {0, 0};                 // placed last step; must wait one turn
        while (!heap.empty()) {
            auto cur = heap.top();
            heap.pop();
            out += cur.second;
            cur.first--;
            if (held.first > 0) heap.push(held);       // previous char may be used again now
            held = cur;
        }
        return out.size() == s.size() ? out : "";
    }
};
