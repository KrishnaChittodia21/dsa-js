struct TrieNode {
    int next[26];
    bool isEnd = false;
    TrieNode() { fill(begin(next), end(next), -1); }
};

class Solution {
    vector<TrieNode> trie;                          // node 0 is the root; children by index

    // ok(start): can w[start..] be split into dictionary words? memo: -1 unknown, 0/1 known
    bool ok(const string& w, int start, vector<int>& memo) {
        int n = w.size();
        if (start == n) return true;
        if (memo[start] != -1) return memo[start];
        int node = 0;
        for (int i = start; i < n; i++) {
            node = trie[node].next[w[i] - 'a'];
            if (node < 0) break;                                   // no word continues this way
            bool wholeWord = start == 0 && i == n - 1;             // w itself does not count
            if (trie[node].isEnd && !wholeWord && ok(w, i + 1, memo)) return memo[start] = 1;
        }
        return memo[start] = 0;
    }

public:
    vector<string> findAllConcatenatedWordsInADict(vector<string>& words) {
        trie.emplace_back();
        for (const string& w : words) {
            int node = 0;
            for (char ch : w) {
                if (trie[node].next[ch - 'a'] < 0) {
                    trie[node].next[ch - 'a'] = trie.size();
                    trie.emplace_back();
                }
                node = trie[node].next[ch - 'a'];
            }
            trie[node].isEnd = true;
        }

        vector<string> result;
        for (const string& w : words) {
            vector<int> memo(w.size() + 1, -1);
            if (ok(w, 0, memo)) result.push_back(w);
        }
        return result;
    }
};
