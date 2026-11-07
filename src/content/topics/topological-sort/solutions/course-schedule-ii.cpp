class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);
            indeg[p[0]]++;
        }
        vector<int> order;                         // doubles as the queue
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) order.push_back(i);
        for (size_t head = 0; head < order.size(); head++) {
            for (int next : adj[order[head]]) {
                if (--indeg[next] == 0) order.push_back(next);
            }
        }
        return (int)order.size() == numCourses ? order : vector<int>();
    }
};
