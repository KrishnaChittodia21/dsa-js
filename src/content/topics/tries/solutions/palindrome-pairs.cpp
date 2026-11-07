struct TrieNode {
    int next[26];
    int index = -1;
    vector<int> palBelow;
    TrieNode() { fill(begin(next), end(next), -1); }
};

class Solution {
    bool isPal(const string& s, int i, int j) {
        while (i < j) if (s[i++] != s[j--]) return false;
        return true;
    }

public:
    vector<vector<int>> palindromePairs(vector<string>& words) {
        // Insert each word REVERSED. palBelow at a node lists words whose remaining
        // (not yet inserted) prefix is a palindrome.
        vector<TrieNode> trie(1);                   // node 0 is the root; children by index
        for (int idx = 0; idx < (int) words.size(); idx++) {
            const string& w = words[idx];
            int node = 0;
            for (int k = (int) w.size() - 1; k >= 0; k--) {
                if (isPal(w, 0, k)) trie[node].palBelow.push_back(idx);
                int ch = w[k] - 'a';
                if (trie[node].next[ch] < 0) {
                    trie[node].next[ch] = trie.size();
                    trie.emplace_back();
                }
                node = trie[node].next[ch];
            }
            trie[node].index = idx;
            trie[node].palBelow.push_back(idx);     // empty remainder is a palindrome
        }

        vector<vector<int>> out;
        for (int i = 0; i < (int) words.size(); i++) {
            const string& w = words[i];
            int node = 0;
            for (int k = 0; k < (int) w.size() && node >= 0; k++) {
                // Case 1: a reversed word ends here and the rest of w is a palindrome
                if (trie[node].index >= 0 && trie[node].index != i && isPal(w, k, w.size() - 1)) out.push_back({i, trie[node].index});
                node = trie[node].next[w[k] - 'a'];
            }
            if (node < 0) continue;
            // Case 2: w consumed; words continuing below with a palindromic remainder
            for (int j : trie[node].palBelow) if (j != i) out.push_back({i, j});
        }
        return out;
    }
};
