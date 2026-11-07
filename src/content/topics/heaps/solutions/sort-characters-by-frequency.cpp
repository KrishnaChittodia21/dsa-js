class Solution {
public:
    string frequencySort(string s) {
        unordered_map<char, int> count;
        for (char c : s) count[c]++;

        priority_queue<pair<int, char>> heap;    // {count, char}, most frequent first
        for (auto& [c, n] : count) heap.push({n, c});

        string out;
        while (!heap.empty()) {
            auto [n, c] = heap.top();
            heap.pop();
            out.append(n, c);
        }
        return out;
    }
};
