struct TrieNode {
    int next[26];
    vector<string> top;
    TrieNode() { fill(begin(next), end(next), -1); }
};

class Solution {
public:
    vector<vector<string>> suggestedProducts(vector<string>& products, string searchWord) {
        vector<string> sorted = products;
        sort(sorted.begin(), sorted.end());         // sorted insert → first 3 are the smallest
        vector<TrieNode> trie(1);                   // node 0 is the root; children by index
        for (const string& p : sorted) {
            int node = 0;
            for (char ch : p) {
                if (trie[node].next[ch - 'a'] < 0) {
                    trie[node].next[ch - 'a'] = trie.size();
                    trie.emplace_back();
                }
                node = trie[node].next[ch - 'a'];
                if (trie[node].top.size() < 3) trie[node].top.push_back(p);
            }
        }

        vector<vector<string>> out;
        int node = 0;
        for (char ch : searchWord) {
            if (node >= 0) node = trie[node].next[ch - 'a']; // once lost, stay lost
            out.push_back(node >= 0 ? trie[node].top : vector<string>{});
        }
        return out;
    }
};
