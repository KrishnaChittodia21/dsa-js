class Solution {
public:
    vector<vector<int>> verticalTraversal(TreeNode* root) {
        vector<array<int, 3>> cells;                       // {col, row, val}
        stack<tuple<TreeNode*, int, int>> st;              // iterative DFS: {node, row, col}
        st.push({root, 0, 0});
        while (!st.empty()) {
            auto [node, row, col] = st.top();
            st.pop();
            cells.push_back({col, row, node->val});
            if (node->left) st.push({node->left, row + 1, col - 1});
            if (node->right) st.push({node->right, row + 1, col + 1});
        }

        // column first, then row (top to bottom), then value
        sort(cells.begin(), cells.end());

        vector<vector<int>> result;
        for (int i = 0; i < (int)cells.size(); i++) {
            if (i == 0 || cells[i][0] != cells[i - 1][0]) result.push_back({});   // a new column starts
            result.back().push_back(cells[i][2]);
        }
        return result;
    }
};
