struct TrieNode {
    int next[26];
    bool isEnd = false;
    TrieNode() { fill(begin(next), end(next), -1); }
};

class Solution {
    vector<TrieNode> trie;                          // node 0 is the root; children by index

    string shortestRoot(const string& word) {
        int node = 0;
        for (int i = 0; i < (int) word.size(); i++) {
            node = trie[node].next[word[i] - 'a'];
            if (node < 0) return word;                  // no root is a prefix
            if (trie[node].isEnd) return word.substr(0, i + 1); // first root hit = shortest
        }
        return word;
    }

public:
    string replaceWords(vector<string>& dictionary, string sentence) {
        trie.emplace_back();
        for (const string& r : dictionary) {
            int node = 0;
            for (char ch : r) {
                if (trie[node].next[ch - 'a'] < 0) {
                    trie[node].next[ch - 'a'] = trie.size();
                    trie.emplace_back();
                }
                node = trie[node].next[ch - 'a'];
            }
            trie[node].isEnd = true;
        }

        istringstream in(sentence);
        string word, out;
        while (in >> word) {
            if (!out.empty()) out += ' ';
            out += shortestRoot(word);
        }
        return out;
    }
};
