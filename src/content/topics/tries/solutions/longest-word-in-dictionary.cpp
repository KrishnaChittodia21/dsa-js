struct TrieNode {
    int next[26];
    int wordIndex = -1;                             // index into words, -1 = no word ends here
    TrieNode() { fill(begin(next), end(next), -1); }
};

class Solution {
    vector<TrieNode> trie;                          // node 0 is the root; children by index
    string best;

    void dfs(int node, const vector<string>& words) {
        for (int child : trie[node].next) {         // a → z: first hit at a length is the smallest
            if (child < 0 || trie[child].wordIndex < 0) continue; // prefix must itself be a word
            const string& w = words[trie[child].wordIndex];
            if (w.size() > best.size()) best = w;
            dfs(child, words);
        }
    }

public:
    string longestWord(vector<string>& words) {
        trie.emplace_back();
        for (int i = 0; i < (int) words.size(); i++) {
            int node = 0;
            for (char ch : words[i]) {
                if (trie[node].next[ch - 'a'] < 0) {
                    trie[node].next[ch - 'a'] = trie.size();
                    trie.emplace_back();
                }
                node = trie[node].next[ch - 'a'];
            }
            trie[node].wordIndex = i;               // mark end of word
        }
        dfs(0, words);
        return best;
    }
};
