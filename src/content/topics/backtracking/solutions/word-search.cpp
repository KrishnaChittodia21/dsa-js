class Solution {
public:
    bool exist(vector<vector<char>>& board, string word) {
        // Cheap pruning: the board must contain enough of every letter.
        unordered_map<char, int> count, need;
        for (auto& row : board) for (char ch : row) count[ch]++;
        for (char ch : word) need[ch]++;
        for (auto& [ch, k] : need) {
            if (count[ch] < k) return false;
        }

        // Start from the rarer end of the word (fewer starting points -> less branching).
        if (count[word.front()] > count[word.back()]) reverse(word.begin(), word.end());

        for (int r = 0; r < (int)board.size(); r++) {
            for (int c = 0; c < (int)board[0].size(); c++) {
                if (dfs(board, word, r, c, 0)) return true;
            }
        }
        return false;
    }

private:
    bool dfs(vector<vector<char>>& board, const string& word, int r, int c, int k) {
        if (k == (int)word.size()) return true;
        if (r < 0 || c < 0 || r >= (int)board.size() || c >= (int)board[0].size() || board[r][c] != word[k]) return false;
        char saved = board[r][c];
        board[r][c] = '#';                          // mark: on the current path
        bool found = dfs(board, word, r + 1, c, k + 1) || dfs(board, word, r - 1, c, k + 1) ||
                     dfs(board, word, r, c + 1, k + 1) || dfs(board, word, r, c - 1, k + 1);
        board[r][c] = saved;                        // restore for other paths
        return found;
    }
};
