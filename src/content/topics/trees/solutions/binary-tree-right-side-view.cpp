class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
        vector<int> view;
        if (!root) return view;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front();
                q.pop();
                if (i == size - 1) view.push_back(node->val);   // last node of this level
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
        }
        return view;
    }
};
