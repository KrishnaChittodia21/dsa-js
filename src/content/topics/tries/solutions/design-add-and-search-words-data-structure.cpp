struct TrieNode {
    int next[26];
    bool isEnd = false;
    TrieNode() { fill(begin(next), end(next), -1); }
};

class WordDictionary {
    vector<TrieNode> trie;                          // node 0 is the root; children by index

    bool dfs(const string& word, int node, int i) {
        if (i == (int) word.size()) return trie[node].isEnd;
        char ch = word[i];
        if (ch == '.') {
            for (int child : trie[node].next) {
                if (child >= 0 && dfs(word, child, i + 1)) return true; // any matching branch is enough
            }
            return false;
        }
        int next = trie[node].next[ch - 'a'];
        return next >= 0 && dfs(word, next, i + 1);
    }

public:
    WordDictionary() : trie(1) {}

    void addWord(string word) {
        int node = 0;
        for (char ch : word) {
            if (trie[node].next[ch - 'a'] < 0) {
                trie[node].next[ch - 'a'] = trie.size();
                trie.emplace_back();
            }
            node = trie[node].next[ch - 'a'];
        }
        trie[node].isEnd = true;
    }

    bool search(string word) {
        return dfs(word, 0, 0);
    }
};
