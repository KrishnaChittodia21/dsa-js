class Solution {
public:
    int rangeSumBST(TreeNode* root, int low, int high) {
        int sum = 0;
        vector<TreeNode*> stack;
        if (root) stack.push_back(root);
        while (!stack.empty()) {
            TreeNode* node = stack.back();
            stack.pop_back();
            if (node->val < low) {                // node and its left side are too small
                if (node->right) stack.push_back(node->right);
            } else if (node->val > high) {        // node and its right side are too large
                if (node->left) stack.push_back(node->left);
            } else {                              // in range: count it, both sides may help
                sum += node->val;
                if (node->left) stack.push_back(node->left);
                if (node->right) stack.push_back(node->right);
            }
        }
        return sum;
    }
};
