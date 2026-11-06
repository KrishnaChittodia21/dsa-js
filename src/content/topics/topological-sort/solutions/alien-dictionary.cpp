class Solution {
public:
    string alienOrder(vector<string>& words) {
        unordered_map<char, unordered_set<char>> adj;   // letter → letters that come after it
        unordered_map<char, int> indeg;
        for (auto& w : words)
            for (char ch : w) { adj[ch]; indeg[ch]; }

        for (size_t i = 0; i + 1 < words.size(); i++) {
            const string& w1 = words[i];
            const string& w2 = words[i + 1];
            size_t len = min(w1.size(), w2.size()), j = 0;
            while (j < len && w1[j] == w2[j]) j++;
            if (j == len) {
                if (w1.size() > w2.size()) return "";   // "abc" before "ab" is impossible
                continue;                               // prefix in the right order: no info
            }
            char a = w1[j], b = w2[j];
            if (adj[a].insert(b).second) indeg[b]++;    // dedupe so indeg matches adj
        }

        string order;
        for (auto& [ch, d] : indeg) if (d == 0) order += ch;
        for (size_t head = 0; head < order.size(); head++) {
            for (char next : adj[order[head]]) {
                if (--indeg[next] == 0) order += next;
            }
        }
        return order.size() == adj.size() ? order : "";   // shorter → cycle
    }
};
