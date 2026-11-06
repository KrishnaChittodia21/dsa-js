struct TrieNode {
    int next[26];
    int childCount = 0;
    string word;                                    // empty = no word ends here
    TrieNode() { fill(begin(next), end(next), -1); }
};

class Solution {
    vector<TrieNode> trie;                          // node 0 is the root; children by index
    vector<string> found;
    int rows = 0, cols = 0;

    void dfs(vector<vector<char>>& board, int r, int c, int parent) {
        char ch = board[r][c];
        int node = trie[parent].next[ch - 'a'];
        if (node < 0) return;                       // prune: not a prefix of any word
        if (!trie[node].word.empty()) {
            found.push_back(trie[node].word);
            trie[node].word.clear();                // report each word once
        }
        board[r][c] = '#';                          // mark visited
        const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] != '#') dfs(board, nr, nc, node);
        }
        board[r][c] = ch;                           // backtrack
        if (trie[node].childCount == 0 && trie[node].word.empty()) { // drop dead leaf
            trie[parent].next[ch - 'a'] = -1;
            trie[parent].childCount--;
        }
    }

public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        trie.emplace_back();
        for (const string& w : words) {
            int node = 0;
            for (char ch : w) {
                int k = ch - 'a';
                if (trie[node].next[k] < 0) {
                    trie[node].next[k] = trie.size();
                    trie[node].childCount++;
                    trie.emplace_back();
                }
                node = trie[node].next[k];
            }
            trie[node].word = w;
        }

        rows = board.size(), cols = board[0].size();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) dfs(board, r, c, 0);
        }
        return found;
    }
};
