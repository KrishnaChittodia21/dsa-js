class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indeg(numCourses, 0);
        for (auto& p : prerequisites) {
            adj[p[1]].push_back(p[0]);             // pre must come before course
            indeg[p[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int taken = 0;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            taken++;
            for (int next : adj[u]) {
                if (--indeg[next] == 0) q.push(next);
            }
        }
        return taken == numCourses;                // fewer → some courses are stuck on a cycle
    }
};
