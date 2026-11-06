class Solution {
    static const int NOT_COVERED = 0, COVERED = 1, CAMERA = 2;
    int cameras = 0;

    int dfs(TreeNode* node) {
        if (!node) return COVERED;                 // null needs nothing
        int left = dfs(node->left);
        int right = dfs(node->right);
        if (left == NOT_COVERED || right == NOT_COVERED) {
            cameras++;                             // a child depends on me
            return CAMERA;
        }
        if (left == CAMERA || right == CAMERA) return COVERED;
        return NOT_COVERED;                        // let my parent cover me
    }

public:
    int minCameraCover(TreeNode* root) {
        cameras = 0;
        if (dfs(root) == NOT_COVERED) cameras++;   // nobody above the root
        return cameras;
    }
};
