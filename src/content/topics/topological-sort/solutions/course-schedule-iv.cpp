class Solution {
public:
    vector<bool> checkIfPrerequisite(int numCourses, vector<vector<int>>& prerequisites, vector<vector<int>>& queries) {
        int n = numCourses;
        vector<vector<int>> adj(n);
        vector<int> indeg(n, 0);
        for (auto& p : prerequisites) { adj[p[0]].push_back(p[1]); indeg[p[1]]++; } // a before b

        // reach[v][u] = 1 if u is a (possibly indirect) prerequisite of v
        vector<vector<char>> reach(n, vector<char>(n, 0));
        vector<int> queue;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue.push_back(i);
        for (size_t head = 0; head < queue.size(); head++) {
            int u = queue[head]; // reach[u] is final
            for (int v : adj[u]) {
                reach[v][u] = 1;
                for (int k = 0; k < n; k++) if (reach[u][k]) reach[v][k] = 1;
                if (--indeg[v] == 0) queue.push_back(v);
            }
        }
        vector<bool> answer;
        for (auto& q : queries) answer.push_back(reach[q[1]][q[0]] == 1);
        return answer;
    }
};
