class Solution {
public:
    bool canVisitAllRooms(vector<vector<int>>& rooms) {
        int n = rooms.size();
        vector<bool> visited(n, false);
        visited[0] = true;
        int count = 1;
        vector<int> stack{0};
        while (!stack.empty()) {
            int room = stack.back();
            stack.pop_back();
            for (int key : rooms[room]) {
                if (!visited[key]) {
                    visited[key] = true;
                    count++;
                    stack.push_back(key);
                }
            }
        }
        return count == n;
    }
};
